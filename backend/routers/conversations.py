from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from db.session import get_db
from models.conversation import Conversation, Message
from models.listing import Listing, CarModel
from models.user import User
from schemas.conversation import MessageCreate, MessageOut, ConversationOut, ConversationSummary
from utils.auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])

_CONV_OPTIONS = [
    joinedload(Conversation.messages),
    joinedload(Conversation.buyer),
    joinedload(Conversation.seller),
    joinedload(Conversation.listing).joinedload(Listing.model).joinedload(CarModel.brand),
]


def _build_title(listing: Listing | None) -> str:
    if listing and listing.model:
        brand = listing.model.brand.Name if listing.model.brand else ""
        return f"{brand} {listing.model.Name} {listing.ManufacturingYear}".strip()
    return f"Anunț #{listing.ListingID}" if listing else "Anunț șters"


def _other_name(conv: Conversation, current_user_id: int) -> str:
    u = conv.seller if conv.BuyerID == current_user_id else conv.buyer
    if u:
        name = f"{u.FirstName or ''} {u.LastName or ''}".strip()
        return name if name else u.Email
    return "Utilizator necunoscut"


def _conv_to_dict(conv: Conversation, current_user_id: int) -> dict:
    """Return a plain dict that matches ConversationOut — avoids mutating ORM objects."""
    return {
        "ConversationID": conv.ConversationID,
        "ListingID": conv.ListingID,
        "BuyerID": conv.BuyerID,
        "SellerID": conv.SellerID,
        "CreatedAt": conv.CreatedAt,
        "UpdatedAt": conv.UpdatedAt,
        "listing_title": _build_title(conv.listing),
        "other_party_name": _other_name(conv, current_user_id),
        "messages": [
            {
                "MessageID": m.MessageID,
                "ConversationID": m.ConversationID,
                "SenderID": m.SenderID,
                "Content": m.Content,
                "SentAt": m.SentAt,
                "IsRead": m.IsRead,
            }
            for m in sorted(conv.messages, key=lambda m: m.SentAt or "")
        ],
    }


@router.post("/{listing_id}", response_model=ConversationOut, status_code=201)
def start_conversation(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Anunțul nu a fost găsit")
    if listing.SellerID == current_user.UserID:
        raise HTTPException(status_code=400, detail="Nu poți trimite mesaj pe propriul anunț")

    existing = (
        db.query(Conversation)
        .options(*_CONV_OPTIONS)
        .filter(
            Conversation.ListingID == listing_id,
            Conversation.BuyerID == current_user.UserID,
        )
        .first()
    )
    if existing:
        return _conv_to_dict(existing, current_user.UserID)

    conv = Conversation(
        ListingID=listing_id,
        BuyerID=current_user.UserID,
        SellerID=listing.SellerID,
    )
    db.add(conv)
    db.commit()

    conv = (
        db.query(Conversation)
        .options(*_CONV_OPTIONS)
        .filter(Conversation.ConversationID == conv.ConversationID)
        .first()
    )
    return _conv_to_dict(conv, current_user.UserID)


@router.get("", response_model=List[ConversationSummary])
def my_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .options(*_CONV_OPTIONS)
        .filter(
            (Conversation.BuyerID == current_user.UserID)
            | (Conversation.SellerID == current_user.UserID)
        )
        .order_by(Conversation.UpdatedAt.desc())
        .all()
    )

    result = []
    for conv in convs:
        msgs = sorted(conv.messages, key=lambda m: m.SentAt or "")
        last_msg = msgs[-1].Content if msgs else None
        unread = sum(1 for m in msgs if not m.IsRead and m.SenderID != current_user.UserID)
        result.append({
            "ConversationID": conv.ConversationID,
            "ListingID": conv.ListingID,
            "BuyerID": conv.BuyerID,
            "SellerID": conv.SellerID,
            "CreatedAt": conv.CreatedAt,
            "UpdatedAt": conv.UpdatedAt,
            "listing_title": _build_title(conv.listing),
            "other_party_name": _other_name(conv, current_user.UserID),
            "last_message": last_msg,
            "unread_count": unread,
        })
    return result


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .options(*_CONV_OPTIONS)
        .filter(Conversation.ConversationID == conversation_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Nu a fost găsit")
    if current_user.UserID not in (conv.BuyerID, conv.SellerID):
        raise HTTPException(status_code=403, detail="Acces interzis")
    return _conv_to_dict(conv, current_user.UserID)


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.ConversationID == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Nu a fost găsit")
    if current_user.UserID not in (conv.BuyerID, conv.SellerID):
        raise HTTPException(status_code=403, detail="Acces interzis")

    msg = Message(ConversationID=conversation_id, SenderID=current_user.UserID, Content=data.content)
    db.add(msg)
    from sqlalchemy.sql import func
    conv.UpdatedAt = func.now()
    db.commit()
    db.refresh(msg)
    return msg


@router.patch("/{conversation_id}/messages/read", status_code=204)
def mark_messages_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Message).filter(
        Message.ConversationID == conversation_id,
        Message.SenderID != current_user.UserID,
        Message.IsRead == False,
    ).update({"IsRead": True})
    db.commit()

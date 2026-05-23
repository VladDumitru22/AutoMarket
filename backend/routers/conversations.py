from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from db.session import get_db
from models.conversation import Conversation, Message
from models.listing import Listing
from models.user import User
from schemas.conversation import MessageCreate, MessageOut, ConversationOut
from utils.auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("/{listing_id}", response_model=ConversationOut, status_code=201)
def start_conversation(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.SellerID == current_user.UserID:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    existing = db.query(Conversation).filter(
        Conversation.ListingID == listing_id,
        Conversation.BuyerID == current_user.UserID,
    ).first()
    if existing:
        return existing

    conv = Conversation(
        ListingID=listing_id,
        BuyerID=current_user.UserID,
        SellerID=listing.SellerID,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("", response_model=List[ConversationOut])
def my_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .filter(
            (Conversation.BuyerID == current_user.UserID)
            | (Conversation.SellerID == current_user.UserID)
        )
        .all()
    )


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .filter(Conversation.ConversationID == conversation_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.UserID not in (conv.BuyerID, conv.SellerID):
        raise HTTPException(status_code=403, detail="Forbidden")
    return conv


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.ConversationID == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.UserID not in (conv.BuyerID, conv.SellerID):
        raise HTTPException(status_code=403, detail="Forbidden")

    msg = Message(
        ConversationID=conversation_id,
        SenderID=current_user.UserID,
        Content=data.content,
    )
    db.add(msg)
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

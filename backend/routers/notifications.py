from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.session import get_db
from models.conversation import Conversation, Message
from models.offer import Offer
from models.listing import Listing
from models.user import User
from utils.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/count")
def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unread_messages = (
        db.query(func.count(Message.MessageID))
        .join(Conversation, Message.ConversationID == Conversation.ConversationID)
        .filter(
            (Conversation.BuyerID == current_user.UserID)
            | (Conversation.SellerID == current_user.UserID),
            Message.SenderID != current_user.UserID,
            Message.IsRead == False,
        )
        .scalar() or 0
    )

    pending_offers = (
        db.query(func.count(Offer.OfferID))
        .join(Listing, Offer.ListingID == Listing.ListingID)
        .filter(
            Listing.SellerID == current_user.UserID,
            Offer.OfferStatus == "Pending",
        )
        .scalar() or 0
    )

    # For buyers: counter-offers waiting for their response
    counter_offers = (
        db.query(func.count(Offer.OfferID))
        .filter(
            Offer.BuyerID == current_user.UserID,
            Offer.OfferStatus == "Countered",
        )
        .scalar() or 0
    )

    return {
        "unread_messages": unread_messages,
        "pending_offers": pending_offers,
        "counter_offers": counter_offers,
        "total": unread_messages + pending_offers + counter_offers,
    }

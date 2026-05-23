from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    MessageID: int
    ConversationID: int
    SenderID: int
    Content: str
    SentAt: Optional[datetime]
    IsRead: bool

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    ConversationID: int
    ListingID: int
    BuyerID: int
    SellerID: int
    CreatedAt: Optional[datetime]
    UpdatedAt: Optional[datetime]
    listing_title: str
    other_party_name: str
    last_message: Optional[str] = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    ConversationID: int
    ListingID: int
    BuyerID: int
    SellerID: int
    CreatedAt: Optional[datetime]
    UpdatedAt: Optional[datetime]
    listing_title: str
    other_party_name: str
    messages: List[MessageOut] = []

    model_config = {"from_attributes": True}

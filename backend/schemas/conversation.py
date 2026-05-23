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


class ConversationOut(BaseModel):
    ConversationID: int
    ListingID: int
    BuyerID: int
    SellerID: int
    CreatedAt: Optional[datetime]
    UpdatedAt: Optional[datetime]
    messages: List[MessageOut] = []

    model_config = {"from_attributes": True}

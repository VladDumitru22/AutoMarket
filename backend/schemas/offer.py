from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


class OfferCreate(BaseModel):
    offered_amount: Decimal


class OfferOut(BaseModel):
    OfferID: int
    ListingID: int
    BuyerID: int
    OfferedAmount: Decimal
    OfferDate: Optional[datetime]
    IsAccepted: bool

    model_config = {"from_attributes": True}

from pydantic import BaseModel, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional


class OfferCreate(BaseModel):
    offered_amount: Decimal

    @field_validator("offered_amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Suma oferită trebuie să fie pozitivă")
        return v


class CounterOfferCreate(BaseModel):
    counter_amount: Decimal

    @field_validator("counter_amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Contraoferta trebuie să fie pozitivă")
        return v


class OfferOut(BaseModel):
    OfferID: int
    ListingID: int
    BuyerID: int
    OfferedAmount: Decimal
    OfferDate: Optional[datetime]
    IsAccepted: bool
    OfferStatus: Optional[str] = "Pending"
    CounterAmount: Optional[Decimal] = None

    model_config = {"from_attributes": True}

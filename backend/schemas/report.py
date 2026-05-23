from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReportCreate(BaseModel):
    listing_id: Optional[int] = None
    message_id: Optional[int] = None
    reason: str


class ReportOut(BaseModel):
    ReportID: int
    ListingID: Optional[int]
    MessageID: Optional[int]
    ReporterID: int
    Reason: str
    ReportStatus: str
    CreatedAt: Optional[datetime]

    model_config = {"from_attributes": True}

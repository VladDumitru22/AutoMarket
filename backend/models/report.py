from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Report(Base):
    __tablename__ = "Reports"

    ReportID = Column(Integer, primary_key=True, index=True)
    ListingID = Column(Integer, ForeignKey("Listings.ListingID"), nullable=True)
    MessageID = Column(Integer, ForeignKey("Messages.MessageID"), nullable=True)
    ReporterID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    Reason = Column(Text, nullable=False)
    ReportStatus = Column(String(50), default="Pending")
    CreatedAt = Column(DateTime, server_default=func.now())

    listing = relationship("Listing", back_populates="reports")
    message = relationship("Message", back_populates="reports")
    reporter = relationship("User", back_populates="reports")

from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Offer(Base):
    __tablename__ = "Offers"

    OfferID = Column(Integer, primary_key=True, index=True)
    ListingID = Column(Integer, ForeignKey("Listings.ListingID"), nullable=False)
    BuyerID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    OfferedAmount = Column(Numeric(18, 2), nullable=False)
    OfferDate = Column(DateTime, server_default=func.now())
    IsAccepted = Column(Boolean, default=False)

    listing = relationship("Listing", back_populates="offers")
    buyer = relationship("User", back_populates="offers")

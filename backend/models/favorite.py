from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Favorite(Base):
    __tablename__ = "Favorites"

    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)
    ListingID = Column(Integer, ForeignKey("Listings.ListingID", ondelete="CASCADE"), primary_key=True)
    AddedAt = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing", back_populates="favorites")

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Role(Base):
    __tablename__ = "Roles"

    RoleID = Column(Integer, primary_key=True, index=True)
    RoleName = Column(String(50), nullable=False, unique=True)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "Users"

    UserID = Column(Integer, primary_key=True, index=True)
    Email = Column(String(255), nullable=False, unique=True)
    PasswordHash = Column(String, nullable=False)
    FirstName = Column(String(100))
    LastName = Column(String(100))
    CreatedAt = Column(DateTime, server_default=func.now())
    RoleID = Column(Integer, ForeignKey("Roles.RoleID"), nullable=False)

    role = relationship("Role", back_populates="users")
    listings = relationship("Listing", back_populates="seller", foreign_keys="Listing.SellerID")
    offers = relationship("Offer", back_populates="buyer")
    favorites = relationship("Favorite", back_populates="user")
    sent_messages = relationship("Message", back_populates="sender")
    reports = relationship("Report", back_populates="reporter")
    buyer_conversations = relationship("Conversation", back_populates="buyer", foreign_keys="Conversation.BuyerID")
    seller_conversations = relationship("Conversation", back_populates="seller", foreign_keys="Conversation.SellerID")

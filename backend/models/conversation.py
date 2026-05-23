from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Conversation(Base):
    __tablename__ = "Conversations"

    ConversationID = Column(Integer, primary_key=True, index=True)
    ListingID = Column(Integer, ForeignKey("Listings.ListingID"), nullable=False)
    BuyerID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    SellerID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    CreatedAt = Column(DateTime, server_default=func.now())
    UpdatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())

    listing = relationship("Listing", back_populates="conversations")
    buyer = relationship("User", back_populates="buyer_conversations", foreign_keys=[BuyerID])
    seller = relationship("User", back_populates="seller_conversations", foreign_keys=[SellerID])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "Messages"

    MessageID = Column(Integer, primary_key=True, index=True)
    ConversationID = Column(Integer, ForeignKey("Conversations.ConversationID", ondelete="CASCADE"), nullable=False)
    SenderID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    Content = Column(Text, nullable=False)
    SentAt = Column(DateTime, server_default=func.now())
    IsRead = Column(Boolean, default=False)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
    reports = relationship("Report", back_populates="message")

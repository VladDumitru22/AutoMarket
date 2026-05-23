from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base


class Brand(Base):
    __tablename__ = "Brands"

    BrandID = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False, unique=True)

    models = relationship("CarModel", back_populates="brand")


class CarModel(Base):
    __tablename__ = "Models"

    ModelID = Column(Integer, primary_key=True, index=True)
    BrandID = Column(Integer, ForeignKey("Brands.BrandID"), nullable=False)
    Name = Column(String(100), nullable=False)

    brand = relationship("Brand", back_populates="models")
    listings = relationship("Listing", back_populates="model")


class ListingStatus(Base):
    __tablename__ = "ListingStatus"

    StatusID = Column(Integer, primary_key=True, index=True)
    StatusName = Column(String(50), nullable=False, unique=True)

    listings = relationship("Listing", back_populates="status")


class Listing(Base):
    __tablename__ = "Listings"

    ListingID = Column(Integer, primary_key=True, index=True)
    SellerID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    ModelID = Column(Integer, ForeignKey("Models.ModelID"), nullable=False)
    ManufacturingYear = Column(Integer, nullable=False)
    Price = Column(Numeric(18, 2), nullable=False)
    Mileage = Column(Integer, nullable=False)
    HorsePower = Column(Integer, nullable=False)
    Description = Column(Text)
    FinalSellingPrice = Column(Numeric(18, 2), nullable=True)
    CreatedAt = Column(DateTime, server_default=func.now())
    UpdatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())
    StatusID = Column(Integer, ForeignKey("ListingStatus.StatusID"), nullable=False)

    seller = relationship("User", back_populates="listings", foreign_keys=[SellerID])
    model = relationship("CarModel", back_populates="listings")
    status = relationship("ListingStatus", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="listing")
    favorites = relationship("Favorite", back_populates="listing", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="listing")
    reports = relationship("Report", back_populates="listing")


class ListingImage(Base):
    __tablename__ = "ListingImages"

    ImageID = Column(Integer, primary_key=True, index=True)
    ListingID = Column(Integer, ForeignKey("Listings.ListingID", ondelete="CASCADE"), nullable=False)
    ImageURL = Column(Text, nullable=False)
    IsPrimary = Column(SmallInteger, default=0)

    listing = relationship("Listing", back_populates="images")

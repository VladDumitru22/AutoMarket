from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class BrandOut(BaseModel):
    BrandID: int
    Name: str
    model_config = {"from_attributes": True}


class CarModelOut(BaseModel):
    ModelID: int
    BrandID: int
    Name: str
    model_config = {"from_attributes": True}


class ListingImageOut(BaseModel):
    ImageID: int
    ImageURL: str
    IsPrimary: Optional[bool]
    model_config = {"from_attributes": True}


class ListingCreate(BaseModel):
    model_id: int
    manufacturing_year: int
    price: Decimal
    mileage: int
    horse_power: int
    description: Optional[str] = None
    image_urls: Optional[List[str]] = []


class ListingUpdate(BaseModel):
    price: Optional[Decimal] = None
    description: Optional[str] = None
    mileage: Optional[int] = None
    horse_power: Optional[int] = None
    manufacturing_year: Optional[int] = None


class ListingOut(BaseModel):
    ListingID: int
    SellerID: int
    ModelID: int
    ManufacturingYear: int
    Price: Decimal
    Mileage: int
    HorsePower: int
    Description: Optional[str]
    FinalSellingPrice: Optional[Decimal]
    CreatedAt: Optional[datetime]
    StatusID: int
    images: List[ListingImageOut] = []
    model: Optional[CarModelOut] = None

    model_config = {"from_attributes": True}


class ListingSearch(BaseModel):
    brand_id: Optional[int] = None
    model_id: Optional[int] = None
    max_price: Optional[Decimal] = None
    min_price: Optional[Decimal] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    keyword: Optional[str] = None

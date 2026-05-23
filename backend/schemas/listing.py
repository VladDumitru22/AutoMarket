from pydantic import BaseModel, field_validator
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
    brand: Optional[BrandOut] = None
    model_config = {"from_attributes": True}


class ListingImageOut(BaseModel):
    ImageID: int
    ImageURL: str
    IsPrimary: Optional[int]
    model_config = {"from_attributes": True}


class ListingCreate(BaseModel):
    model_id: int
    manufacturing_year: int
    price: Decimal
    mileage: int
    horse_power: int
    description: Optional[str] = None
    image_urls: Optional[List[str]] = []
    primary_image_index: Optional[int] = 0

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Prețul trebuie să fie pozitiv")
        return v

    @field_validator("mileage")
    @classmethod
    def mileage_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Kilometrajul nu poate fi negativ")
        return v

    @field_validator("horse_power")
    @classmethod
    def hp_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Puterea trebuie să fie pozitivă")
        return v

    @field_validator("manufacturing_year")
    @classmethod
    def year_valid(cls, v: int) -> int:
        if v < 1900 or v > 2026:
            raise ValueError("An de fabricație invalid")
        return v


class ListingUpdate(BaseModel):
    price: Optional[Decimal] = None
    description: Optional[str] = None
    mileage: Optional[int] = None
    horse_power: Optional[int] = None
    manufacturing_year: Optional[int] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Prețul trebuie să fie pozitiv")
        return v


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

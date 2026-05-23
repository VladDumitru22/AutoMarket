from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from db.session import get_db
from models.listing import Listing, ListingImage, CarModel, Brand
from models.user import User
from schemas.listing import ListingCreate, ListingUpdate, ListingOut, BrandOut, CarModelOut
from utils.auth import get_current_user

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("/brands", response_model=List[BrandOut])
def get_brands(db: Session = Depends(get_db)):
    return db.query(Brand).all()


@router.get("/models", response_model=List[CarModelOut])
def get_models(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(CarModel)
    if brand_id:
        q = q.filter(CarModel.BrandID == brand_id)
    return q.all()


@router.get("", response_model=List[ListingOut])
def search_listings(
    keyword: Optional[str] = None,
    brand_id: Optional[int] = None,
    model_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.model))
        .join(Listing.status)
        .filter(Listing.status.has(StatusName="Active"))
    )
    if brand_id:
        q = q.join(Listing.model).filter(CarModel.BrandID == brand_id)
    if model_id:
        q = q.filter(Listing.ModelID == model_id)
    if min_price is not None:
        q = q.filter(Listing.Price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.Price <= max_price)
    if year_from:
        q = q.filter(Listing.ManufacturingYear >= year_from)
    if year_to:
        q = q.filter(Listing.ManufacturingYear <= year_to)
    if keyword:
        q = q.filter(Listing.Description.ilike(f"%{keyword}%"))
    return q.all()


@router.get("/mine", response_model=List[ListingOut])
def my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.model))
        .filter(Listing.SellerID == current_user.UserID)
        .all()
    )


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.model))
        .filter(Listing.ListingID == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("", response_model=ListingOut, status_code=201)
def create_listing(
    data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from models.listing import ListingStatus
    active_status = db.query(ListingStatus).filter(ListingStatus.StatusName == "Active").first()
    listing = Listing(
        SellerID=current_user.UserID,
        ModelID=data.model_id,
        ManufacturingYear=data.manufacturing_year,
        Price=data.price,
        Mileage=data.mileage,
        HorsePower=data.horse_power,
        Description=data.description,
        StatusID=active_status.StatusID,
    )
    db.add(listing)
    db.flush()

    for i, url in enumerate(data.image_urls or []):
        img = ListingImage(ListingID=listing.ListingID, ImageURL=url, IsPrimary=(i == 0))
        db.add(img)

    db.commit()
    db.refresh(listing)
    return listing


@router.put("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Not your listing")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(listing, field.replace("_", "").title() if "_" in field else field, value)

    if data.price is not None:
        listing.Price = data.price
    if data.description is not None:
        listing.Description = data.description
    if data.mileage is not None:
        listing.Mileage = data.mileage
    if data.horse_power is not None:
        listing.HorsePower = data.horse_power
    if data.manufacturing_year is not None:
        listing.ManufacturingYear = data.manufacturing_year

    db.commit()
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/mark-sold", response_model=ListingOut)
def mark_sold(
    listing_id: int,
    final_price: Optional[Decimal] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from models.listing import ListingStatus
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Not your listing")

    sold_status = db.query(ListingStatus).filter(ListingStatus.StatusName == "Sold").first()
    listing.StatusID = sold_status.StatusID
    if final_price:
        listing.FinalSellingPrice = final_price
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    if listing.SellerID != current_user.UserID and current_user.RoleID != 3:
        raise HTTPException(status_code=403, detail="Forbidden")

    from models.listing import ListingStatus
    removed = db.query(ListingStatus).filter(ListingStatus.StatusName == "Removed").first()
    listing.StatusID = removed.StatusID
    db.commit()

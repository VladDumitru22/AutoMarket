from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from models.offer import Offer
from models.listing import Listing
from models.user import User
from schemas.offer import OfferCreate, OfferOut
from utils.auth import get_current_user

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("/{listing_id}", response_model=OfferOut, status_code=201)
def place_offer(
    listing_id: int,
    data: OfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.SellerID == current_user.UserID:
        raise HTTPException(status_code=400, detail="Cannot offer on your own listing")

    from models.listing import ListingStatus
    status = db.query(ListingStatus).filter(ListingStatus.StatusID == listing.StatusID).first()
    if status and status.StatusName != "Active":
        raise HTTPException(status_code=400, detail="Listing is not active")

    offer = Offer(
        ListingID=listing_id,
        BuyerID=current_user.UserID,
        OfferedAmount=data.offered_amount,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/listing/{listing_id}", response_model=List[OfferOut])
def get_listing_offers(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    if listing.SellerID != current_user.UserID and current_user.RoleID != 3:
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(Offer).filter(Offer.ListingID == listing_id).all()


@router.post("/{offer_id}/accept", response_model=OfferOut)
def accept_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Forbidden")

    offer.IsAccepted = True
    db.commit()
    db.refresh(offer)
    return offer

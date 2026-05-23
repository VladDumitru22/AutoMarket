from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from db.session import get_db
from models.favorite import Favorite
from models.listing import Listing
from models.user import User
from schemas.listing import ListingOut
from utils.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=List[ListingOut])
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favs = db.query(Favorite).filter(Favorite.UserID == current_user.UserID).all()
    listing_ids = [f.ListingID for f in favs]
    return (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.model))
        .filter(Listing.ListingID.in_(listing_ids))
        .all()
    )


@router.post("/{listing_id}", status_code=201)
def add_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Listing).filter(Listing.ListingID == listing_id).first():
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = db.query(Favorite).filter(
        Favorite.UserID == current_user.UserID,
        Favorite.ListingID == listing_id,
    ).first()
    if existing:
        return {"detail": "Already in favorites"}

    db.add(Favorite(UserID=current_user.UserID, ListingID=listing_id))
    db.commit()
    return {"detail": "Added to favorites"}


@router.delete("/{listing_id}", status_code=204)
def remove_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = db.query(Favorite).filter(
        Favorite.UserID == current_user.UserID,
        Favorite.ListingID == listing_id,
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")
    db.delete(fav)
    db.commit()

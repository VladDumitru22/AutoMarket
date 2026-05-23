from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from models.offer import Offer
from models.listing import Listing
from models.user import User
from schemas.offer import OfferCreate, CounterOfferCreate, OfferOut
from utils.auth import get_current_user

router = APIRouter(prefix="/offers", tags=["offers"])


def _get_active_listing(listing_id: int, db: Session) -> Listing:
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Anunțul nu a fost găsit")
    from models.listing import ListingStatus
    status = db.query(ListingStatus).filter(ListingStatus.StatusID == listing.StatusID).first()
    if status and status.StatusName != "Active":
        raise HTTPException(status_code=400, detail="Anunțul nu mai este activ")
    return listing


@router.post("/{listing_id}", response_model=OfferOut, status_code=201)
def place_offer(
    listing_id: int,
    data: OfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = _get_active_listing(listing_id, db)
    if listing.SellerID == current_user.UserID:
        raise HTTPException(status_code=400, detail="Nu poți face ofertă pe propriul anunț")

    offer = Offer(
        ListingID=listing_id,
        BuyerID=current_user.UserID,
        OfferedAmount=data.offered_amount,
        OfferStatus="Pending",
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
        raise HTTPException(status_code=404, detail="Nu a fost găsit")
    if listing.SellerID != current_user.UserID and current_user.RoleID != 3:
        raise HTTPException(status_code=403, detail="Acces interzis")
    return db.query(Offer).filter(Offer.ListingID == listing_id).order_by(Offer.OfferDate.desc()).all()


@router.get("/mine", response_model=List[OfferOut])
def get_my_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Offer).filter(Offer.BuyerID == current_user.UserID).order_by(Offer.OfferDate.desc()).all()


@router.post("/{offer_id}/accept", response_model=OfferOut)
def accept_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta nu a fost găsită")
    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Acces interzis")
    offer.IsAccepted = True
    offer.OfferStatus = "Accepted"
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/reject", response_model=OfferOut)
def reject_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta nu a fost găsită")
    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Acces interzis")
    if offer.OfferStatus not in ("Pending", "Countered"):
        raise HTTPException(status_code=400, detail="Oferta nu poate fi respinsă")
    offer.OfferStatus = "Rejected"
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/counter", response_model=OfferOut)
def counter_offer(
    offer_id: int,
    data: CounterOfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta nu a fost găsită")
    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing.SellerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Acces interzis")
    if offer.OfferStatus != "Pending":
        raise HTTPException(status_code=400, detail="Poți contracara doar ofertele în așteptare")
    offer.OfferStatus = "Countered"
    offer.CounterAmount = data.counter_amount
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/accept-counter", response_model=OfferOut)
def accept_counter(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta nu a fost găsită")
    if offer.BuyerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Acces interzis")
    if offer.OfferStatus != "Countered":
        raise HTTPException(status_code=400, detail="Nu există o contraofertă de acceptat")
    offer.OfferStatus = "Accepted"
    offer.IsAccepted = True
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/reject-counter", response_model=OfferOut)
def reject_counter(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.OfferID == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Oferta nu a fost găsită")
    if offer.BuyerID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Acces interzis")
    if offer.OfferStatus != "Countered":
        raise HTTPException(status_code=400, detail="Nu există o contraofertă de respins")
    offer.OfferStatus = "Rejected"
    db.commit()
    db.refresh(offer)
    return offer

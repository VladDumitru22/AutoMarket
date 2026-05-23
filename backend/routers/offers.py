from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from db.session import get_db
from models.offer import Offer
from models.listing import Listing, CarModel
from models.user import User
from schemas.offer import OfferCreate, CounterOfferCreate, OfferOut
from utils.auth import get_current_user
from core.ws_manager import fire_notify

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
    fire_notify(listing.SellerID)  # notify seller: new pending offer
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
    offers = (
        db.query(Offer)
        .options(joinedload(Offer.listing).joinedload(Listing.model).joinedload(CarModel.brand))
        .filter(Offer.BuyerID == current_user.UserID)
        .order_by(Offer.OfferDate.desc())
        .all()
    )
    result = []
    for o in offers:
        listing = o.listing
        title = None
        price = None
        if listing and listing.model:
            brand = listing.model.brand.Name if listing.model.brand else ""
            title = f"{brand} {listing.model.Name} {listing.ManufacturingYear}".strip()
            price = listing.Price
        result.append({
            "OfferID": o.OfferID,
            "ListingID": o.ListingID,
            "BuyerID": o.BuyerID,
            "OfferedAmount": o.OfferedAmount,
            "OfferDate": o.OfferDate,
            "IsAccepted": o.IsAccepted,
            "OfferStatus": o.OfferStatus,
            "CounterAmount": o.CounterAmount,
            "listing_title": title,
            "listing_price": price,
            "buyer_name": None,
        })
    return result


@router.get("/received", response_model=List[OfferOut])
def get_received_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from models.user import User as UserModel
    my_listing_ids = [
        row[0] for row in
        db.query(Listing.ListingID).filter(Listing.SellerID == current_user.UserID).all()
    ]
    if not my_listing_ids:
        return []
    offers = (
        db.query(Offer)
        .options(
            joinedload(Offer.listing).joinedload(Listing.model).joinedload(CarModel.brand),
            joinedload(Offer.buyer),
        )
        .filter(
            Offer.ListingID.in_(my_listing_ids),
            Offer.OfferStatus.in_(["Pending", "Countered"]),
        )
        .order_by(Offer.OfferDate.desc())
        .all()
    )
    result = []
    for o in offers:
        listing = o.listing
        buyer = o.buyer
        title = None
        price = None
        if listing and listing.model:
            brand = listing.model.brand.Name if listing.model.brand else ""
            title = f"{brand} {listing.model.Name} {listing.ManufacturingYear}".strip()
            price = listing.Price
        buyer_name = None
        if buyer:
            name = f"{buyer.FirstName or ''} {buyer.LastName or ''}".strip()
            buyer_name = name if name else buyer.Email
        result.append({
            "OfferID": o.OfferID,
            "ListingID": o.ListingID,
            "BuyerID": o.BuyerID,
            "OfferedAmount": o.OfferedAmount,
            "OfferDate": o.OfferDate,
            "IsAccepted": o.IsAccepted,
            "OfferStatus": o.OfferStatus,
            "CounterAmount": o.CounterAmount,
            "listing_title": title,
            "listing_price": price,
            "buyer_name": buyer_name,
        })
    return result


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
    fire_notify(offer.BuyerID)  # notify buyer: offer accepted
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
    fire_notify(offer.BuyerID)  # notify buyer: offer rejected
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
    fire_notify(offer.BuyerID)  # notify buyer: counter offer received
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
    # notify seller that buyer accepted the counter
    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing:
        fire_notify(listing.SellerID)
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
    # notify seller that buyer rejected the counter
    listing = db.query(Listing).filter(Listing.ListingID == offer.ListingID).first()
    if listing:
        fire_notify(listing.SellerID)
    return offer

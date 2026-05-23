from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from db.session import get_db
from models.listing import Listing, ListingStatus, CarModel, ListingImage
from models.report import Report
from models.user import User
from schemas.listing import ListingOut
from schemas.report import ReportOut
from utils.auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/reports", response_model=List[ReportOut])
def get_reports(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(Report)
        .options(
            joinedload(Report.reporter),
            joinedload(Report.listing).joinedload(Listing.model).joinedload(CarModel.brand),
            joinedload(Report.listing).joinedload(Listing.images),
        )
        .filter(Report.ReportStatus == "Pending")
        .order_by(Report.CreatedAt.desc())
        .all()
    )
    result = []
    for r in reports:
        reporter_name = None
        if r.reporter:
            name = f"{r.reporter.FirstName or ''} {r.reporter.LastName or ''}".strip()
            reporter_name = name if name else r.reporter.Email

        listing_title = None
        listing_image = None
        if r.listing:
            if r.listing.model:
                brand = r.listing.model.brand.Name if r.listing.model.brand else ""
                listing_title = f"{brand} {r.listing.model.Name} {r.listing.ManufacturingYear}".strip()
            if r.listing.images:
                primary = next((img for img in r.listing.images if img.IsPrimary), None)
                listing_image = (primary or r.listing.images[0]).ImageURL

        result.append({
            "ReportID": r.ReportID,
            "ListingID": r.ListingID,
            "MessageID": r.MessageID,
            "ReporterID": r.ReporterID,
            "Reason": r.Reason,
            "ReportStatus": r.ReportStatus,
            "CreatedAt": r.CreatedAt,
            "reporter_name": reporter_name,
            "listing_title": listing_title,
            "listing_image": listing_image,
        })
    return result


@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    pending_reports = (
        db.query(func.count(Report.ReportID))
        .filter(Report.ReportStatus == "Pending")
        .scalar() or 0
    )
    total_users = (
        db.query(func.count(User.UserID))
        .filter(User.RoleID != 3)
        .scalar() or 0
    )
    active_status = db.query(ListingStatus).filter(ListingStatus.StatusName == "Active").first()
    active_listings = 0
    if active_status:
        active_listings = (
            db.query(func.count(Listing.ListingID))
            .filter(Listing.StatusID == active_status.StatusID)
            .scalar() or 0
        )
    return {
        "pending_reports": pending_reports,
        "total_users": total_users,
        "active_listings": active_listings,
    }


@router.post("/reports/{report_id}/resolve", response_model=ReportOut)
def resolve_report(
    report_id: int,
    action: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.ReportID == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if action == "remove" and report.ListingID:
        listing = db.query(Listing).filter(Listing.ListingID == report.ListingID).first()
        removed = db.query(ListingStatus).filter(ListingStatus.StatusName == "Removed").first()
        if listing:
            listing.StatusID = removed.StatusID

    report.ReportStatus = "Resolved"
    db.commit()
    db.refresh(report)
    return report


@router.delete("/listings/{listing_id}", status_code=204)
def admin_delete_listing(
    listing_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.ListingID == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    removed = db.query(ListingStatus).filter(ListingStatus.StatusName == "Removed").first()
    listing.StatusID = removed.StatusID
    db.commit()


@router.get("/users", response_model=List[dict])
def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [
        {
            "UserID": u.UserID,
            "Email": u.Email,
            "FirstName": u.FirstName,
            "LastName": u.LastName,
            "RoleID": u.RoleID,
        }
        for u in users
    ]

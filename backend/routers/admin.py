from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from models.listing import Listing, ListingStatus
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
    return db.query(Report).filter(Report.ReportStatus == "Pending").all()


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

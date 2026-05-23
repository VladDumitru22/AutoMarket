from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from models.report import Report
from models.user import User
from schemas.report import ReportCreate, ReportOut
from utils.auth import get_current_user
from core.ws_manager import fire_notify

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportOut, status_code=201)
def create_report(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.listing_id and not data.message_id:
        raise HTTPException(status_code=400, detail="Must provide listing_id or message_id")

    report = Report(
        ListingID=data.listing_id,
        MessageID=data.message_id,
        ReporterID=current_user.UserID,
        Reason=data.reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    admin_users = db.query(User).filter(User.RoleID == 3).all()
    for admin in admin_users:
        fire_notify(admin.UserID)

    return report

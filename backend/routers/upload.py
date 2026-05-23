from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from models.user import User
from utils.auth import get_current_user
from services.cloudinary_service import upload_image
from core.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(
            status_code=503,
            detail="Cloudinary nu este configurat. Adaugă CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY și CLOUDINARY_API_SECRET în .env"
        )
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 imagini permise")

    urls = []
    for f in files:
        if f.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"Tip fișier invalid: {f.content_type}. Acceptat: JPEG, PNG, WEBP")
        contents = await f.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"Fișierul {f.filename} depășește limita de 5MB")
        url = upload_image(contents)
        urls.append(url)

    return {"urls": urls}

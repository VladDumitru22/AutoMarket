import cloudinary
import cloudinary.uploader
from core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_image(file_bytes: bytes, public_id: str | None = None) -> str:
    kwargs: dict = {"folder": "automarket"}
    if public_id:
        kwargs["public_id"] = public_id
    result = cloudinary.uploader.upload(file_bytes, **kwargs)
    return result["secure_url"]

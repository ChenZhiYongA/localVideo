import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session

from config import settings
from database import get_session
from models import MediaFile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/thumbnail", tags=["thumbnails"])


@router.get("/{media_id}")
def get_thumbnail(media_id: str, session: Session = Depends(get_session)) -> FileResponse:
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Not found")
    if media.thumbnail_path and Path(media.thumbnail_path).is_file():
        return FileResponse(media.thumbnail_path, media_type="image/jpeg")
    placeholder = settings.thumbnails_dir / f"{media_id}.jpg"
    if placeholder.is_file():
        return FileResponse(placeholder, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Thumbnail not ready")

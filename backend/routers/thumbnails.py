import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlmodel import Session

from config import settings
from database import get_session
from models import MediaFile
from services.thumbnail import generate_image_thumbnail, generate_video_thumbnail, placeholder_jpeg_bytes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/thumbnail", tags=["thumbnails"])


@router.get("/{media_id}", response_model=None)
async def get_thumbnail(media_id: str, session: Session = Depends(get_session)):
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Not found")
    if media.thumbnail_path and Path(media.thumbnail_path).is_file():
        return FileResponse(media.thumbnail_path, media_type="image/jpeg")
    disk = settings.thumbnails_dir / f"{media_id}.jpg"
    if disk.is_file():
        return FileResponse(disk, media_type="image/jpeg")

    src = Path(media.file_path)
    if (
        media.media_type in ("video", "image")
        and src.is_file()
        and media.thumbnail_status in ("pending", "failed", "done")
    ):
        try:
            if media.media_type == "video":
                out = await generate_video_thumbnail(
                    media_id, str(src), float(media.duration_seconds or 1.0)
                )
            else:
                out = await generate_image_thumbnail(media_id, str(src))
            media.thumbnail_path = out
            media.thumbnail_status = "done"
            session.add(media)
            session.commit()
            return FileResponse(out, media_type="image/jpeg")
        except Exception:
            logger.exception("on-demand thumbnail %s", media_id)
            session.rollback()

    return Response(
        content=placeholder_jpeg_bytes(),
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache"},
    )

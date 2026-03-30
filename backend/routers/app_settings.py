import logging
import shutil

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from config import settings
from database import get_session
from models import MediaFile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["settings"])


class FFmpegPatch(BaseModel):
    preset: str | None = None
    crf: str | None = None
    transcode_concurrency: int | None = Field(None, ge=1, le=4)


@router.post("/clear-hls")
def clear_hls(session: Session = Depends(get_session)) -> dict:
    root = settings.hls_dir
    if root.is_dir():
        for child in root.iterdir():
            try:
                if child.is_dir():
                    shutil.rmtree(child, ignore_errors=True)
                else:
                    child.unlink(missing_ok=True)
            except Exception as e:
                logger.warning("clear hls %s: %s", child, e)
    rows = session.exec(select(MediaFile).where(MediaFile.media_type == "video")).all()
    for m in rows:
        m.transcode_status = "pending"
        m.hls_path = None
        session.add(m)
    session.commit()
    return {"ok": True}


@router.post("/clear-thumbnails")
def clear_thumbnails(session: Session = Depends(get_session)) -> dict:
    root = settings.thumbnails_dir
    if root.is_dir():
        for child in root.glob("*.jpg"):
            try:
                child.unlink(missing_ok=True)
            except Exception as e:
                logger.warning("clear thumb %s: %s", child, e)
    rows = session.exec(select(MediaFile)).all()
    for m in rows:
        m.thumbnail_status = "pending"
        m.thumbnail_path = None
        session.add(m)
    session.commit()
    return {"ok": True}


@router.patch("/ffmpeg")
def patch_ffmpeg(body: FFmpegPatch) -> dict:
    allowed = {
        "ultrafast",
        "superfast",
        "veryfast",
        "faster",
        "fast",
        "medium",
        "slow",
        "slower",
        "veryslow",
    }
    if body.preset is not None:
        if body.preset not in allowed:
            raise HTTPException(status_code=422, detail="invalid preset")
        settings.ffmpeg_preset = body.preset
    if body.crf is not None:
        settings.ffmpeg_crf = str(body.crf)
    if body.transcode_concurrency is not None:
        settings.transcode_concurrency = body.transcode_concurrency
    return {
        "preset": settings.ffmpeg_preset,
        "crf": settings.ffmpeg_crf,
        "transcode_concurrency": settings.transcode_concurrency,
    }


@router.get("/ffmpeg")
def get_ffmpeg() -> dict:
    return {
        "preset": settings.ffmpeg_preset,
        "crf": settings.ffmpeg_crf,
        "transcode_concurrency": settings.transcode_concurrency,
    }

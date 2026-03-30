import logging
import mimetypes
import os
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlmodel import Session

from config import settings
from database import get_session
from models import MediaFile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stream", tags=["stream"])


def _mime_for_path(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".webm":
        return "video/webm"
    if ext in (".mp4", ".m4v"):
        return "video/mp4"
    if ext == ".mkv":
        return "video/x-matroska"
    guess, _ = mimetypes.guess_type(file_path)
    return guess or "application/octet-stream"


@router.get("/direct/{media_id}")
async def stream_direct(
    media_id: str,
    session: Session = Depends(get_session),
    range_header: str | None = Header(None, alias="Range"),
):
    media = session.get(MediaFile, media_id)
    if not media or media.media_type != "video":
        raise HTTPException(status_code=404, detail="Not found")
    if media.transcode_status != "not_needed":
        raise HTTPException(status_code=404, detail="Direct stream not available")

    file_path = media.file_path
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File missing")

    file_size = os.path.getsize(file_path)
    media_type = _mime_for_path(file_path)

    if range_header:
        range_val = range_header.replace("bytes=", "")
        parts = range_val.split("-", 1)
        start_s, end_s = parts[0], parts[1] if len(parts) > 1 else ""
        try:
            start = int(start_s) if start_s else 0
        except ValueError:
            raise HTTPException(status_code=416, detail="Invalid range")
        end = int(end_s) if end_s else file_size - 1
        end = min(end, file_size - 1)
        if start > end or start < 0:
            raise HTTPException(status_code=416, detail="Invalid range")
        chunk_size = end - start + 1

        def iterfile():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iterfile(),
            status_code=206,
            media_type=media_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(chunk_size),
                "Accept-Ranges": "bytes",
            },
        )

    return FileResponse(file_path, media_type=media_type, headers={"Accept-Ranges": "bytes"})


@router.get("/{media_id}/master.m3u8")
def get_master_playlist(media_id: str, session: Session = Depends(get_session)) -> FileResponse:
    media = session.get(MediaFile, media_id)
    if not media or media.transcode_status != "done":
        raise HTTPException(status_code=404, detail="Stream not ready")
    m3u8_path = settings.hls_dir / media_id / "master.m3u8"
    if not m3u8_path.is_file():
        raise HTTPException(status_code=404, detail="Playlist not found")
    return FileResponse(
        str(m3u8_path),
        media_type="application/vnd.apple.mpegurl",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/{media_id}/{quality}/stream.m3u8")
def get_variant_playlist(
    media_id: str,
    quality: str,
    session: Session = Depends(get_session),
) -> FileResponse:
    media = session.get(MediaFile, media_id)
    if not media or media.transcode_status != "done":
        raise HTTPException(status_code=404, detail="Stream not ready")
    path = settings.hls_dir / media_id / quality / "stream.m3u8"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Playlist not found")
    return FileResponse(
        str(path),
        media_type="application/vnd.apple.mpegurl",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/{media_id}/{quality}/{segment_name}")
def get_segment(
    media_id: str,
    quality: str,
    segment_name: str,
    session: Session = Depends(get_session),
) -> FileResponse:
    if ".." in segment_name or "/" in segment_name or "\\" in segment_name:
        raise HTTPException(status_code=400, detail="Invalid segment")
    media = session.get(MediaFile, media_id)
    if not media or media.transcode_status != "done":
        raise HTTPException(status_code=404, detail="Stream not ready")
    path = settings.hls_dir / media_id / quality / segment_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Segment not found")
    return FileResponse(str(path), media_type="video/MP2T")

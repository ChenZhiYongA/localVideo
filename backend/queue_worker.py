import asyncio
import logging
from pathlib import Path

from sqlmodel import Session, col, select

from config import settings
from database import engine
from models import MediaFile
from routers import ws as ws_router
from services.thumbnail import generate_image_thumbnail, generate_video_thumbnail
from services.transcoder import transcode_to_hls
from utils.ffprobe import can_stream_mp4_direct
from utils.file_utils import get_extension
import state

logger = logging.getLogger(__name__)


async def thumbnail_loop() -> None:
    await asyncio.sleep(0.5)
    while True:
        try:
            await _process_one_thumbnail()
        except Exception:
            logger.exception("thumbnail_loop")
        await asyncio.sleep(0.4)


async def _process_one_thumbnail() -> None:
    with Session(engine) as session:
        row = session.exec(
            select(MediaFile)
            .where(MediaFile.thumbnail_status == "pending")
            .where(col(MediaFile.media_type).in_(["video", "image"]))
            .limit(1)
        ).first()
        if not row:
            return
        row.thumbnail_status = "processing"
        session.add(row)
        session.commit()
        mid = row.id
        file_path = row.file_path
        media_type = row.media_type
        duration = row.duration_seconds or 1.0

    try:
        if media_type == "video":
            out = await generate_video_thumbnail(mid, file_path, float(duration))
        else:
            out = await generate_image_thumbnail(mid, file_path)
        with Session(engine) as session:
            r = session.get(MediaFile, mid)
            if r:
                r.thumbnail_path = out
                r.thumbnail_status = "done"
                session.add(r)
                session.commit()
    except Exception:
        logger.exception("thumbnail failed %s", mid)
        with Session(engine) as session:
            r = session.get(MediaFile, mid)
            if r:
                r.thumbnail_status = "failed"
                session.add(r)
                session.commit()


async def transcode_loop() -> None:
    await asyncio.sleep(1.0)
    while True:
        try:
            await _process_one_transcode()
        except Exception:
            logger.exception("transcode_loop")
        await asyncio.sleep(0.3)


async def _process_one_transcode() -> None:
    with Session(engine) as session:
        row = session.exec(
            select(MediaFile)
            .where(MediaFile.media_type == "video")
            .where(MediaFile.transcode_status == "pending")
            .limit(1)
        ).first()
        if not row:
            return
        mid = row.id
        fp = row.file_path
        ext = get_extension(Path(fp).name)

    try:
        if ext == "webm" or await can_stream_mp4_direct(fp):
            with Session(engine) as session:
                r = session.get(MediaFile, mid)
                if r and r.transcode_status == "pending":
                    r.transcode_status = "not_needed"
                    r.hls_path = None
                    session.add(r)
                    session.commit()
            return
    except Exception:
        logger.exception("direct check %s", mid)

    with Session(engine) as session:
        r = session.get(MediaFile, mid)
        if not r or r.transcode_status != "pending":
            return
        r.transcode_status = "processing"
        session.add(r)
        session.commit()
        title = r.name_no_ext
        dur = float(r.duration_seconds or 1)
        height = int(r.height or 360)
        path = r.file_path

    async def progress_cb(media_id: str, quality: str, pct: float) -> None:
        state.transcode_progress[media_id] = pct
        await ws_router.broadcast(
            {
                "type": "transcode_progress",
                "data": {
                    "media_id": media_id,
                    "quality": quality,
                    "percent": pct,
                    "title": title,
                },
            }
        )

    try:
        master = await transcode_to_hls(mid, path, dur, height, progress_cb)
        with Session(engine) as session:
            r2 = session.get(MediaFile, mid)
            if r2:
                r2.transcode_status = "done"
                r2.hls_path = master
                session.add(r2)
                session.commit()
        state.transcode_progress.pop(mid, None)
        await ws_router.broadcast({"type": "transcode_done", "data": {"media_id": mid, "title": title}})
    except Exception:
        logger.exception("transcode failed %s", mid)
        with Session(engine) as session:
            r2 = session.get(MediaFile, mid)
            if r2:
                r2.transcode_status = "failed"
                session.add(r2)
                session.commit()
        state.transcode_progress.pop(mid, None)


def start_workers() -> list[asyncio.Task]:
    return [
        asyncio.create_task(thumbnail_loop()),
        asyncio.create_task(transcode_loop()),
    ]

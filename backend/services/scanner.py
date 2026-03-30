import logging
import os
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select

from config import settings
from models import MediaFile, WatchedFolder
from utils.ffprobe import get_image_dimensions, get_video_metadata
from utils.file_utils import get_extension, is_audio, is_image, is_video
from utils.hash_utils import stable_media_id

logger = logging.getLogger(__name__)


def _classify_media(ext: str) -> str | None:
    if is_video(ext):
        return "video"
    if is_image(ext):
        return "image"
    if is_audio(ext):
        return "audio"
    return None


async def scan_folder(
    folder: WatchedFolder,
    session: Session,
    progress_callback=None,
) -> dict:
    found_paths: set[str] = set()
    new_count = 0
    updated_count = 0
    max_depth = settings.scan_max_depth

    async def walk(dir_path: Path, depth: int = 0) -> None:
        nonlocal new_count, updated_count
        if depth > max_depth:
            return
        try:
            entries = list(os.scandir(dir_path))
        except PermissionError:
            logger.warning("Permission denied: %s", dir_path)
            return
        except OSError as e:
            logger.warning("scandir error %s: %s", dir_path, e)
            return

        for entry in entries:
            if entry.is_dir(follow_symlinks=False):
                await walk(Path(entry.path), depth + 1)
            elif entry.is_file():
                ext = get_extension(entry.name)
                media_type = _classify_media(ext)
                if not media_type:
                    continue
                try:
                    stat = entry.stat()
                except OSError:
                    continue
                file_path = os.path.normpath(str(entry.path))
                found_paths.add(file_path)

                existing = session.exec(select(MediaFile).where(MediaFile.file_path == file_path)).first()
                modified_ts = datetime.utcfromtimestamp(stat.st_mtime)

                if existing and existing.modified_at == modified_ts:
                    continue

                meta: dict = {}
                img_w, img_h = None, None
                if media_type == "video":
                    try:
                        meta = await get_video_metadata(file_path)
                    except Exception:
                        logger.exception("video metadata %s", file_path)
                        meta = {}
                elif media_type == "image":
                    try:
                        img_w, img_h = await get_image_dimensions(file_path)
                    except Exception:
                        logger.exception("image dimensions %s", file_path)
                elif media_type == "audio":
                    try:
                        meta = await get_video_metadata(file_path)
                    except Exception:
                        logger.exception("audio metadata %s", file_path)
                        meta = {}

                file_id = stable_media_id(file_path)

                thumb_st = "pending"
                trans_st = "pending"
                if media_type == "audio":
                    thumb_st = "not_needed"
                    trans_st = "not_needed"

                if existing:
                    existing.modified_at = modified_ts
                    existing.file_size = stat.st_size
                    existing.file_name = entry.name
                    existing.name_no_ext = Path(entry.name).stem
                    existing.extension = ext
                    existing.media_type = media_type
                    if media_type == "video" and meta:
                        existing.duration_seconds = meta.get("duration")
                        existing.width = meta.get("width")
                        existing.height = meta.get("height")
                        existing.fps = meta.get("fps")
                        existing.video_codec = meta.get("video_codec")
                        existing.audio_codec = meta.get("audio_codec")
                        existing.bitrate_kbps = meta.get("bitrate_kbps")
                    elif media_type == "image":
                        existing.img_width = img_w
                        existing.img_height = img_h
                        existing.duration_seconds = None
                    elif media_type == "audio":
                        existing.duration_seconds = meta.get("duration")
                        existing.audio_codec = meta.get("audio_codec")
                        existing.bitrate_kbps = meta.get("bitrate_kbps")
                    if media_type == "video":
                        existing.thumbnail_status = "pending"
                        existing.thumbnail_path = None
                        existing.transcode_status = "pending"
                        existing.hls_path = None
                    elif media_type == "image":
                        existing.thumbnail_status = "pending"
                        existing.thumbnail_path = None
                        existing.transcode_status = "pending"
                        existing.hls_path = None
                    elif media_type == "audio":
                        existing.thumbnail_status = "not_needed"
                        existing.thumbnail_path = None
                        existing.transcode_status = "not_needed"
                        existing.hls_path = None
                    session.add(existing)
                    updated_count += 1
                else:
                    row = MediaFile(
                        id=file_id,
                        folder_id=folder.id,
                        file_path=file_path,
                        file_name=entry.name,
                        name_no_ext=Path(entry.name).stem,
                        extension=ext,
                        media_type=media_type,
                        file_size=stat.st_size,
                        created_at=datetime.utcfromtimestamp(stat.st_ctime) if hasattr(stat, "st_ctime") else None,
                        modified_at=modified_ts,
                        duration_seconds=meta.get("duration")
                        if media_type in ("video", "audio")
                        else None,
                        width=meta.get("width") if media_type == "video" else None,
                        height=meta.get("height") if media_type == "video" else None,
                        fps=meta.get("fps") if media_type == "video" else None,
                        video_codec=meta.get("video_codec") if media_type == "video" else None,
                        audio_codec=meta.get("audio_codec") if media_type in ("video", "audio") else None,
                        bitrate_kbps=meta.get("bitrate_kbps") if media_type in ("video", "audio") else None,
                        img_width=img_w if media_type == "image" else None,
                        img_height=img_h if media_type == "image" else None,
                        thumbnail_status=thumb_st,
                        transcode_status=trans_st,
                    )
                    session.add(row)
                    new_count += 1

                try:
                    session.commit()
                except Exception as e:
                    session.rollback()
                    logger.exception("commit scan row %s: %s", file_path, e)
                    continue

                if progress_callback:
                    try:
                        await progress_callback(entry.name, new_count + updated_count)
                    except Exception as e:
                        logger.exception("progress callback: %s", e)

    root = Path(folder.path)
    if not root.is_dir():
        return {"new": 0, "updated": 0, "total": 0, "error": "not a directory"}

    await walk(root)

    all_in_folder = session.exec(select(MediaFile).where(MediaFile.folder_id == folder.id)).all()
    for record in all_in_folder:
        norm = os.path.normpath(record.file_path)
        if norm not in found_paths:
            session.delete(record)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("stale delete commit: %s", e)

    def ext_of(p: str) -> str:
        return get_extension(Path(p).name)

    video_n = sum(1 for p in found_paths if is_video(ext_of(p)))
    image_n = sum(1 for p in found_paths if is_image(ext_of(p)))
    audio_n = sum(1 for p in found_paths if is_audio(ext_of(p)))
    folder.last_scanned = datetime.utcnow()
    folder.total_files = len(found_paths)
    folder.video_count = video_n
    folder.image_count = image_n
    folder.audio_count = audio_n
    session.add(folder)
    session.commit()

    return {"new": new_count, "updated": updated_count, "total": len(found_paths)}

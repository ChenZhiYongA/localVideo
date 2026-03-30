from datetime import datetime
from typing import Optional

from models import MediaFile
from schemas import MediaItem
from utils.file_utils import format_file_size

try:
    from datetime import UTC
except ImportError:
    UTC = None


def _utc_now() -> datetime:
    if UTC:
        return datetime.now(UTC).replace(tzinfo=None)
    return datetime.utcnow()


def format_duration_seconds(sec: Optional[float]) -> Optional[str]:
    if sec is None:
        return None
    total = int(sec)
    h, m, s = total // 3600, (total % 3600) // 60, total % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def resolution_label_from_height(h: Optional[int]) -> Optional[str]:
    if not h:
        return None
    if h >= 2160:
        return "4K"
    if h >= 1440:
        return "1440p"
    if h >= 1080:
        return "1080p"
    if h >= 720:
        return "720p"
    if h >= 480:
        return "480p"
    if h >= 360:
        return "360p"
    return f"{h}p"


def relative_time(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    now = _utc_now()
    if dt.tzinfo:
        dt = dt.replace(tzinfo=None)
    delta = now - dt
    seconds = int(delta.total_seconds())
    try:
        if seconds < 60:
            return "刚刚"
        if seconds < 3600:
            return f"{seconds // 60} 分钟前"
        if seconds < 86400:
            return f"{seconds // 3600} 小时前"
        if seconds < 604800:
            return f"{seconds // 86400} 天前"
        if seconds < 2592000:
            return f"{seconds // 604800} 周前"
        if seconds < 31536000:
            return f"{seconds // 2592000} 月前"
        return f"{seconds // 31536000} 年前"
    except Exception:
        return dt.isoformat()


def iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat()


def stream_url_for(m: MediaFile) -> Optional[str]:
    if m.media_type != "video":
        return None
    if m.transcode_status == "done":
        return f"/api/stream/{m.id}/master.m3u8"
    if m.transcode_status == "not_needed":
        return f"/api/stream/direct/{m.id}"
    return None


def media_file_to_item(
    m: MediaFile, transcode_pct: Optional[float] = None, *, from_telegram: bool = False
) -> MediaItem:
    mt: str = m.media_type if m.media_type in ("video", "image", "audio") else "video"
    pct = transcode_pct
    if pct is None and m.transcode_status == "processing":
        from state import transcode_progress as tp

        pct = tp.get(m.id)

    return MediaItem(
        id=m.id,
        folder_id=m.folder_id,
        file_name=m.file_name,
        name_no_ext=m.name_no_ext,
        extension=m.extension,
        media_type=mt,  # type: ignore[arg-type]
        file_size=m.file_size,
        file_size_formatted=format_file_size(m.file_size),
        modified_at=iso(m.modified_at),
        modified_relative=relative_time(m.modified_at),
        indexed_at=iso(m.indexed_at) or "",
        duration_seconds=m.duration_seconds,
        duration_formatted=format_duration_seconds(m.duration_seconds),
        width=m.width,
        height=m.height,
        fps=m.fps,
        video_codec=m.video_codec,
        audio_codec=m.audio_codec,
        resolution_label=resolution_label_from_height(m.height),
        img_width=m.img_width,
        img_height=m.img_height,
        thumbnail_status=m.thumbnail_status,
        thumbnail_url=f"/api/thumbnail/{m.id}",
        transcode_status=m.transcode_status,
        stream_url=stream_url_for(m),
        transcode_progress=pct,
        play_count=m.play_count,
        last_played=iso(m.last_played),
        is_favorite=m.is_favorite,
        from_telegram=from_telegram,
    )

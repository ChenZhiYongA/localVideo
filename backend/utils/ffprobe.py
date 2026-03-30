import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Optional, Tuple

from config import settings

logger = logging.getLogger(__name__)


async def _run_ffprobe(path: str) -> Optional[dict[str, Any]]:
    try:
        proc = await asyncio.create_subprocess_exec(
            settings.ffprobe_path,
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, err = await proc.communicate()
        if proc.returncode != 0:
            logger.warning("ffprobe failed for %s: %s", path, err.decode(errors="ignore")[:500])
            return None
        return json.loads(out.decode("utf-8"))
    except FileNotFoundError:
        logger.error("ffprobe not found at %s", settings.ffprobe_path)
        return None
    except Exception as e:
        logger.exception("ffprobe error for %s: %s", path, e)
        return None


def _parse_video_meta(data: dict[str, Any]) -> dict[str, Any]:
    meta: dict[str, Any] = {
        "duration": None,
        "width": None,
        "height": None,
        "fps": None,
        "video_codec": None,
        "audio_codec": None,
        "bitrate_kbps": None,
    }
    fmt = data.get("format") or {}
    dur = fmt.get("duration")
    if dur is not None:
        try:
            meta["duration"] = float(dur)
        except (TypeError, ValueError):
            pass
    br = fmt.get("bit_rate")
    if br is not None:
        try:
            meta["bitrate_kbps"] = int(int(br) / 1000)
        except (TypeError, ValueError):
            pass

    for stream in data.get("streams") or []:
        if stream.get("codec_type") == "video" and meta["width"] is None:
            meta["video_codec"] = stream.get("codec_name")
            meta["width"] = stream.get("width")
            meta["height"] = stream.get("height")
            fr = stream.get("r_frame_rate") or stream.get("avg_frame_rate")
            if fr and isinstance(fr, str) and "/" in fr:
                try:
                    n, d = fr.split("/", 1)
                    meta["fps"] = float(n) / float(d) if float(d) else None
                except (ValueError, ZeroDivisionError):
                    pass
        elif stream.get("codec_type") == "audio" and meta["audio_codec"] is None:
            meta["audio_codec"] = stream.get("codec_name")

    return meta


async def get_video_metadata(file_path: str) -> dict[str, Any]:
    data = await _run_ffprobe(file_path)
    if not data:
        return {}
    return _parse_video_meta(data)


async def can_stream_mp4_direct(file_path: str) -> bool:
    ext = Path(file_path).suffix.lower()
    if ext not in (".mp4", ".m4v"):
        return False
    data = await _run_ffprobe(file_path)
    if not data:
        return False
    v_ok = False
    a_ok = False
    for stream in data.get("streams") or []:
        if stream.get("codec_type") == "video" and stream.get("codec_name") in ("h264", "avc1"):
            v_ok = True
        if stream.get("codec_type") == "audio" and stream.get("codec_name") in ("aac", "mp4a"):
            a_ok = True
    return v_ok and a_ok


async def get_image_dimensions(file_path: str) -> Tuple[Optional[int], Optional[int]]:
    data = await _run_ffprobe(file_path)
    if not data:
        return None, None
    for stream in data.get("streams") or []:
        if stream.get("codec_type") == "video" or stream.get("codec_type") == "image":
            w, h = stream.get("width"), stream.get("height")
            if w and h:
                return int(w), int(h)
    return None, None

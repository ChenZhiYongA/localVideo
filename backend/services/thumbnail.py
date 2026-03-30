import asyncio
import logging
from pathlib import Path

from PIL import Image, ImageOps

from config import settings

logger = logging.getLogger(__name__)


async def generate_video_thumbnail(media_id: str, file_path: str, duration: float) -> str:
    output_path = settings.thumbnails_dir / f"{media_id}.jpg"
    seek_time = max(0.0, min(duration * 0.1, max(duration - 0.1, 0)))

    cmd = [
        settings.ffmpeg_path,
        "-ss",
        str(seek_time),
        "-i",
        file_path,
        "-vframes",
        "1",
        "-vf",
        f"scale={settings.thumbnail_width}:{settings.thumbnail_height}:force_original_aspect_ratio=decrease,"
        f"pad={settings.thumbnail_width}:{settings.thumbnail_height}:(ow-iw)/2:(oh-ih)/2:black",
        "-q:v",
        "3",
        str(output_path),
        "-y",
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await proc.wait()

    if proc.returncode != 0 or not output_path.exists():
        raise RuntimeError(f"video thumbnail failed: {file_path}")

    return str(output_path)


async def generate_image_thumbnail(media_id: str, file_path: str) -> str:
    output_path = settings.thumbnails_dir / f"{media_id}.jpg"
    loop = asyncio.get_event_loop()

    def _generate() -> str:
        with Image.open(file_path) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((settings.thumbnail_width, settings.thumbnail_width), Image.LANCZOS)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(str(output_path), "JPEG", quality=85, optimize=True)
        return str(output_path)

    return await loop.run_in_executor(None, _generate)

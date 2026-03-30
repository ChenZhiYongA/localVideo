import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

TYPE_SUBDIR = {
    "video": "videos",
    "photo": "photos",
    "audio": "audio",
    "voice": "audio",
    "document": "documents",
}


async def download_file(bot, file_id: str, original_filename: str, save_directory: str, media_type: str) -> str:
    safe_name = re.sub(r'[/\\:*?"<>|]', "_", original_filename)
    safe_name = safe_name[:200].strip()
    if not safe_name:
        safe_name = f"file_{file_id[:16]}"

    sub = TYPE_SUBDIR.get(media_type, "documents")
    target_dir = Path(save_directory) / sub
    target_dir.mkdir(parents=True, exist_ok=True)

    target_path = target_dir / safe_name
    if target_path.exists():
        stem = target_path.stem
        suffix = target_path.suffix
        counter = 1
        while target_path.exists():
            target_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

    tg_file = await bot.get_file(file_id)
    await tg_file.download_to_drive(custom_path=str(target_path))

    if not target_path.exists() or target_path.stat().st_size == 0:
        raise RuntimeError(f"Download produced empty or missing file: {target_path}")

    return str(target_path.resolve())

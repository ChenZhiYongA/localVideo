from pathlib import Path

from config import settings


def get_extension(filename: str) -> str:
    p = Path(filename)
    ext = p.suffix.lower().lstrip(".")
    return ext


def is_video(ext: str) -> bool:
    return ext.lower() in settings.video_extensions


def is_image(ext: str) -> bool:
    return ext.lower() in settings.image_extensions


def is_audio(ext: str) -> bool:
    return ext.lower() in settings.audio_extensions


def format_file_size(num_bytes: int) -> str:
    if num_bytes < 1024:
        return f"{num_bytes} B"
    kb = num_bytes / 1024
    if kb < 1024:
        return f"{kb:.1f} KB"
    mb = kb / 1024
    if mb < 1024:
        return f"{mb:.1f} MB"
    gb = mb / 1024
    return f"{gb:.2f} GB"

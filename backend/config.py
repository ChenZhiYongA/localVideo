from pathlib import Path
from typing import FrozenSet, Optional

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8000
    frontend_origin: str = "http://localhost:5173"

    data_dir: Path = Path.home() / ".localtube"

    ffmpeg_path: str = "ffmpeg"
    ffprobe_path: str = "ffprobe"

    hls_segment_duration: int = 6
    thumbnail_width: int = 640
    thumbnail_height: int = 360
    transcode_concurrency: int = 2

    ffmpeg_preset: str = "fast"
    ffmpeg_crf: str = "23"

    scan_max_depth: int = 15

    video_extensions: FrozenSet[str] = Field(
        default_factory=lambda: frozenset(
            {
                "mp4",
                "mkv",
                "webm",
                "avi",
                "mov",
                "m4v",
                "flv",
                "wmv",
                "ts",
                "m2ts",
            }
        )
    )
    image_extensions: FrozenSet[str] = Field(
        default_factory=lambda: frozenset(
            {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "heic"}
        )
    )
    audio_extensions: FrozenSet[str] = Field(
        default_factory=lambda: frozenset(
            {"mp3", "wav", "m4a", "ogg", "flac", "aac", "opus", "wma"}
        )
    )

    telegram_local_api_url: Optional[str] = None

    @computed_field
    @property
    def db_path(self) -> Path:
        return self.data_dir / "localtube.db"

    @computed_field
    @property
    def thumbnails_dir(self) -> Path:
        return self.data_dir / "thumbnails"

    @computed_field
    @property
    def hls_dir(self) -> Path:
        return self.data_dir / "hls"


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.thumbnails_dir.mkdir(parents=True, exist_ok=True)
settings.hls_dir.mkdir(parents=True, exist_ok=True)

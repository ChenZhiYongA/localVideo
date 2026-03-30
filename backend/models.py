from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class WatchedFolder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    path: str = Field(unique=True, index=True)
    name: str
    added_at: datetime = Field(default_factory=datetime.utcnow)
    last_scanned: Optional[datetime] = None
    total_files: int = Field(default=0)
    video_count: int = Field(default=0)
    image_count: int = Field(default=0)
    audio_count: int = Field(default=0)
    is_active: bool = Field(default=True)


class MediaFile(SQLModel, table=True):
    id: str = Field(primary_key=True)
    folder_id: int = Field(foreign_key="watchedfolder.id")
    file_path: str = Field(unique=True, index=True)
    file_name: str
    name_no_ext: str
    extension: str
    media_type: str
    file_size: int
    created_at: Optional[datetime] = None
    modified_at: Optional[datetime] = None
    indexed_at: datetime = Field(default_factory=datetime.utcnow)

    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    video_codec: Optional[str] = None
    audio_codec: Optional[str] = None
    bitrate_kbps: Optional[int] = None

    img_width: Optional[int] = None
    img_height: Optional[int] = None

    thumbnail_status: str = Field(default="pending")
    thumbnail_path: Optional[str] = None
    transcode_status: str = Field(default="pending")
    hls_path: Optional[str] = None

    play_count: int = Field(default=0)
    last_played: Optional[datetime] = None
    is_favorite: bool = Field(default=False)

    watch_time_seconds: int = Field(default=0)
    last_position_seconds: Optional[float] = None
    last_watch_at: Optional[datetime] = None


class TelegramConfig(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True)
    bot_token: str = Field(default="")
    channel_id: str = Field(default="")
    save_directory: str = Field(default="")
    is_enabled: bool = Field(default=False)
    caption_template: str = Field(
        default="📁 {filename}\n📦 {size}\n🎬 {duration}\n📅 {date}"
    )
    auto_scan: bool = Field(default=True)
    auto_transcode: bool = Field(default=True)
    forward_to_channel: bool = Field(default=True)
    allowed_user_ids: str = Field(default="")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    local_api_url: Optional[str] = None


class TelegramMediaLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    received_at: datetime = Field(default_factory=datetime.utcnow)
    sender_id: int
    sender_name: str
    original_filename: str
    saved_path: str
    file_size: int
    media_type: str
    telegram_file_id: str
    channel_message_id: Optional[int] = None
    media_id: Optional[str] = None
    status: str = Field(default="pending")
    error_message: Optional[str] = None


class MediaTag(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    media_id: str = Field(foreign_key="mediafile.id", index=True)
    tag: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    media_id: str = Field(index=True)
    parent_id: Optional[int] = Field(default=None, index=True)
    author: str = Field(default="用户")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class Reaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    media_id: str = Field(index=True)
    emoji: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class MediaItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    folder_id: int
    file_name: str
    name_no_ext: str
    extension: str
    media_type: Literal["video", "image", "audio"]
    file_size: int
    file_size_formatted: str
    modified_at: Optional[str] = None
    modified_relative: Optional[str] = None
    indexed_at: str

    duration_seconds: Optional[float] = None
    duration_formatted: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    video_codec: Optional[str] = None
    audio_codec: Optional[str] = None
    resolution_label: Optional[str] = None

    img_width: Optional[int] = None
    img_height: Optional[int] = None

    thumbnail_status: str
    thumbnail_url: str
    transcode_status: str
    stream_url: Optional[str] = None
    transcode_progress: Optional[float] = None

    play_count: int
    last_played: Optional[str] = None
    is_favorite: bool
    from_telegram: bool = False
    watch_time_seconds: int = 0
    last_position_seconds: Optional[float] = None
    last_watch_at: Optional[str] = None
    tags: list[str] = []


class WatchedFolderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    path: str
    name: str
    added_at: str
    last_scanned: Optional[str] = None
    total_files: int
    video_count: int
    image_count: int
    audio_count: int = 0
    is_active: bool


class LibraryResponse(BaseModel):
    items: list[MediaItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class LibraryStats(BaseModel):
    total_videos: int
    total_images: int
    total_audio: int
    total_size_bytes: int
    total_duration_seconds: float
    folders_count: int
    pending_transcode: int


class FolderCreate(BaseModel):
    path: str = Field(..., min_length=1)


class FavoriteResponse(BaseModel):
    is_favorite: bool


class WatchProgressIn(BaseModel):
    delta_seconds: float = Field(0, ge=0, le=120)
    position_seconds: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[float] = Field(None, ge=0)


class MediaTagsUpdate(BaseModel):
    tags: list[str] = Field(default_factory=list, max_length=32)


class MediaTagsResponse(BaseModel):
    media_id: str
    tags: list[str]


class ScanBody(BaseModel):
    folder_id: Optional[int] = None


class TelegramConfigResponse(BaseModel):
    id: int
    bot_token_masked: str
    channel_id: str
    save_directory: str
    is_enabled: bool
    caption_template: str
    auto_scan: bool
    auto_transcode: bool
    forward_to_channel: bool
    allowed_user_ids: str
    local_api_url: Optional[str] = None
    updated_at: datetime
    bot_status: str
    bot_username: Optional[str] = None


class TelegramConfigUpdate(BaseModel):
    bot_token: Optional[str] = None
    channel_id: Optional[str] = None
    save_directory: Optional[str] = None
    is_enabled: Optional[bool] = None
    caption_template: Optional[str] = None
    auto_scan: Optional[bool] = None
    auto_transcode: Optional[bool] = None
    forward_to_channel: Optional[bool] = None
    allowed_user_ids: Optional[str] = None
    local_api_url: Optional[str] = None


class TestConnectionResponse(BaseModel):
    valid: bool
    bot_username: Optional[str] = None
    bot_first_name: Optional[str] = None
    error: Optional[str] = None


class TestChannelResponse(BaseModel):
    success: bool
    error: Optional[str] = None


class TelegramMediaLogItem(BaseModel):
    id: int
    received_at: datetime
    sender_id: int
    sender_name: str
    original_filename: str
    saved_path: str
    file_size: int
    file_size_formatted: str
    media_type: str
    channel_message_id: Optional[int] = None
    channel_url: Optional[str] = None
    media_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None


class TelegramLogsResponse(BaseModel):
    items: list[TelegramMediaLogItem]
    total: int
    page: int
    per_page: int


class TelegramAggregateStats(BaseModel):
    total_received: int
    total_size_bytes: int
    by_type: dict[str, int]
    last_received_at: Optional[str] = None
    success_rate: float


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    author: str = Field(default="用户", max_length=50)
    parent_id: Optional[int] = None


class CommentOut(BaseModel):
    id: int
    media_id: str
    parent_id: Optional[int] = None
    author: str
    content: str
    created_at: str
    replies: list["CommentOut"] = []


class CommentsResponse(BaseModel):
    items: list[CommentOut]
    total: int


class ReactionToggle(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=8)


class ReactionSummary(BaseModel):
    emoji: str
    count: int


class ReactionsResponse(BaseModel):
    items: list[ReactionSummary]
    total: int

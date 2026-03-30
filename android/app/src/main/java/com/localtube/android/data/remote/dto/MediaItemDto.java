package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class MediaItemDto {
    @SerializedName("id")
    public String id;

    @SerializedName("folder_id")
    public int folderId;

    @SerializedName("file_name")
    public String fileName;

    @SerializedName("name_no_ext")
    public String nameNoExt;

    @SerializedName("extension")
    public String extension;

    @SerializedName("media_type")
    public String mediaType;

    @SerializedName("file_size")
    public long fileSize;

    @SerializedName("file_size_formatted")
    public String fileSizeFormatted;

    @SerializedName("modified_at")
    public String modifiedAt;

    @SerializedName("modified_relative")
    public String modifiedRelative;

    @SerializedName("indexed_at")
    public String indexedAt;

    @SerializedName("duration_seconds")
    public Double durationSeconds;

    @SerializedName("duration_formatted")
    public String durationFormatted;

    @SerializedName("width")
    public Integer width;

    @SerializedName("height")
    public Integer height;

    @SerializedName("fps")
    public Double fps;

    @SerializedName("video_codec")
    public String videoCodec;

    @SerializedName("audio_codec")
    public String audioCodec;

    @SerializedName("resolution_label")
    public String resolutionLabel;

    @SerializedName("img_width")
    public Integer imgWidth;

    @SerializedName("img_height")
    public Integer imgHeight;

    @SerializedName("thumbnail_status")
    public String thumbnailStatus;

    @SerializedName("thumbnail_url")
    public String thumbnailUrl;

    @SerializedName("transcode_status")
    public String transcodeStatus;

    @SerializedName("stream_url")
    public String streamUrl;

    @SerializedName("transcode_progress")
    public Double transcodeProgress;

    @SerializedName("play_count")
    public int playCount;

    @SerializedName("last_played")
    public String lastPlayed;

    @SerializedName("is_favorite")
    public boolean isFavorite;

    @SerializedName("from_telegram")
    public boolean fromTelegram;

    @SerializedName("watch_time_seconds")
    public int watchTimeSeconds;

    @SerializedName("last_position_seconds")
    public Double lastPositionSeconds;

    @SerializedName("last_watch_at")
    public String lastWatchAt;

    @SerializedName("tags")
    public List<String> tags;
}

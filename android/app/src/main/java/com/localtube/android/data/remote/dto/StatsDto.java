package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

public class StatsDto {
    @SerializedName("total_videos")
    public int totalVideos;

    @SerializedName("total_images")
    public int totalImages;

    @SerializedName("total_audio")
    public int totalAudio;

    @SerializedName("total_size_bytes")
    public long totalSizeBytes;

    @SerializedName("total_duration_seconds")
    public double totalDurationSeconds;

    @SerializedName("folders_count")
    public int foldersCount;

    @SerializedName("pending_transcode")
    public int pendingTranscode;
}

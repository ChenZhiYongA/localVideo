package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

public class FolderDto {
    @SerializedName("id")
    public int id;

    @SerializedName("path")
    public String path;

    @SerializedName("name")
    public String name;

    @SerializedName("added_at")
    public String addedAt;

    @SerializedName("last_scanned")
    public String lastScanned;

    @SerializedName("total_files")
    public int totalFiles;

    @SerializedName("video_count")
    public int videoCount;

    @SerializedName("image_count")
    public int imageCount;

    @SerializedName("audio_count")
    public int audioCount;

    @SerializedName("is_active")
    public boolean isActive;
}

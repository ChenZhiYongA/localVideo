package com.localtube.android.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "downloads")
public class DownloadEntity {
    @PrimaryKey
    @NonNull
    public String mediaId;

    public String title;
    public String thumbnailUrl;
    public String filename;
    public String streamUrl;
    public long totalBytes;
    public long downloadedBytes;
    public String status;
    public String filePath;
    public long createdAt;
    public long completedAt;
}

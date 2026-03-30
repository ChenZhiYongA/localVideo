package com.localtube.android.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "cached_media")
public class CachedMediaEntity {
    @PrimaryKey
    @NonNull
    public String id;

    public String title;
    public String filename;
    public String path;
    public long size;
    public String mediaType;
    public String mimeType;
    public double duration;
    public int width;
    public int height;
    public String codec;
    public long bitrate;
    public double fps;
    public boolean hasAudio;
    public int playCount;
    public boolean isFavorite;
    public String transcodeStatus;
    public String createdAt;
    public String updatedAt;
    public String thumbnailUrl;
    public long cachedAt;
}

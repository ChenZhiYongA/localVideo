package com.localtube.android.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "watch_history",
        indices = {@Index(value = "mediaId", unique = true)})
public class WatchHistoryEntity {
    @PrimaryKey
    @NonNull
    public String mediaId;

    public String title;
    public String thumbnailUrl;
    public long durationMs;
    public long positionMs;
    public float progressPercent;
    public long lastWatchedAt;
    public int playCount;
}

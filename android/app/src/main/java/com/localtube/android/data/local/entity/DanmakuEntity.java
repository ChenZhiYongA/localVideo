package com.localtube.android.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "danmaku")
public class DanmakuEntity {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @NonNull
    public String mediaId;

    public long timeMs;
    public String text;
    public int color;
    public int type;
    public long createdAt;
    public String senderName;
}

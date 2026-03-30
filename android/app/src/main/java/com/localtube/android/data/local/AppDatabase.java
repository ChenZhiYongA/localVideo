package com.localtube.android.data.local;

import androidx.room.Database;
import androidx.room.RoomDatabase;

import com.localtube.android.data.local.dao.CachedMediaDao;
import com.localtube.android.data.local.dao.DanmakuDao;
import com.localtube.android.data.local.dao.DownloadDao;
import com.localtube.android.data.local.dao.WatchHistoryDao;
import com.localtube.android.data.local.entity.CachedMediaEntity;
import com.localtube.android.data.local.entity.DanmakuEntity;
import com.localtube.android.data.local.entity.DownloadEntity;
import com.localtube.android.data.local.entity.WatchHistoryEntity;

@Database(
        entities = {
                WatchHistoryEntity.class,
                DownloadEntity.class,
                DanmakuEntity.class,
                CachedMediaEntity.class
        },
        version = 1,
        exportSchema = true
)
public abstract class AppDatabase extends RoomDatabase {
    public abstract WatchHistoryDao watchHistoryDao();
    public abstract DownloadDao downloadDao();
    public abstract DanmakuDao danmakuDao();
    public abstract CachedMediaDao cachedMediaDao();
}

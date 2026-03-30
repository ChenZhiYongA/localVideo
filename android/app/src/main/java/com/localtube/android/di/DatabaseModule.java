package com.localtube.android.di;

import android.content.Context;

import androidx.room.Room;

import com.localtube.android.data.local.AppDatabase;
import com.localtube.android.data.local.dao.CachedMediaDao;
import com.localtube.android.data.local.dao.DanmakuDao;
import com.localtube.android.data.local.dao.DownloadDao;
import com.localtube.android.data.local.dao.WatchHistoryDao;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public class DatabaseModule {

    @Provides
    @Singleton
    public AppDatabase provideDatabase(@ApplicationContext Context context) {
        return Room.databaseBuilder(context, AppDatabase.class, "localtube.db")
                .fallbackToDestructiveMigration()
                .build();
    }

    @Provides
    public WatchHistoryDao provideWatchHistoryDao(AppDatabase db) {
        return db.watchHistoryDao();
    }

    @Provides
    public DownloadDao provideDownloadDao(AppDatabase db) {
        return db.downloadDao();
    }

    @Provides
    public DanmakuDao provideDanmakuDao(AppDatabase db) {
        return db.danmakuDao();
    }

    @Provides
    public CachedMediaDao provideCachedMediaDao(AppDatabase db) {
        return db.cachedMediaDao();
    }
}

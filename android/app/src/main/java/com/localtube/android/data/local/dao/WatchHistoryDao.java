package com.localtube.android.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.localtube.android.data.local.entity.WatchHistoryEntity;

import java.util.List;

@Dao
public interface WatchHistoryDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(WatchHistoryEntity entity);

    @Query("SELECT * FROM watch_history ORDER BY lastWatchedAt DESC LIMIT :limit")
    List<WatchHistoryEntity> getRecentHistory(int limit);

    @Query("SELECT * FROM watch_history ORDER BY lastWatchedAt DESC LIMIT :limit")
    LiveData<List<WatchHistoryEntity>> getRecentHistoryLive(int limit);

    @Query("SELECT * FROM watch_history WHERE mediaId = :mediaId")
    WatchHistoryEntity getByMediaId(String mediaId);

    @Query("SELECT positionMs FROM watch_history WHERE mediaId = :mediaId")
    long getPosition(String mediaId);

    @Query("DELETE FROM watch_history")
    void clearAll();

    @Query("DELETE FROM watch_history WHERE mediaId = :mediaId")
    void delete(String mediaId);
}

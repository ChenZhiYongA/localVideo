package com.localtube.android.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.localtube.android.data.local.entity.DownloadEntity;

import java.util.List;

@Dao
public interface DownloadDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(DownloadEntity entity);

    @Update
    void update(DownloadEntity entity);

    @Query("SELECT * FROM downloads ORDER BY createdAt DESC")
    LiveData<List<DownloadEntity>> getAllLive();

    @Query("SELECT * FROM downloads ORDER BY createdAt DESC")
    List<DownloadEntity> getAll();

    @Query("SELECT * FROM downloads WHERE mediaId = :mediaId")
    DownloadEntity getByMediaId(String mediaId);

    @Query("UPDATE downloads SET downloadedBytes = :bytes, status = :status WHERE mediaId = :mediaId")
    void updateProgress(String mediaId, long bytes, String status);

    @Query("DELETE FROM downloads WHERE mediaId = :mediaId")
    void delete(String mediaId);

    @Query("DELETE FROM downloads")
    void clearAll();
}

package com.localtube.android.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.localtube.android.data.local.entity.CachedMediaEntity;

import java.util.List;

@Dao
public interface CachedMediaDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(CachedMediaEntity entity);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertAll(List<CachedMediaEntity> entities);

    @Query("SELECT * FROM cached_media WHERE id = :id")
    CachedMediaEntity getById(String id);

    @Query("SELECT * FROM cached_media ORDER BY cachedAt DESC LIMIT :limit")
    List<CachedMediaEntity> getRecent(int limit);

    @Query("SELECT * FROM cached_media WHERE mediaType = :type ORDER BY cachedAt DESC")
    List<CachedMediaEntity> getByType(String type);

    @Query("DELETE FROM cached_media")
    void clearAll();
}

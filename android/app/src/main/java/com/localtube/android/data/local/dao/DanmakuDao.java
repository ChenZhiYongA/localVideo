package com.localtube.android.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.localtube.android.data.local.entity.DanmakuEntity;

import java.util.List;

@Dao
public interface DanmakuDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(DanmakuEntity entity);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<DanmakuEntity> entities);

    @Query("SELECT * FROM danmaku WHERE mediaId = :mediaId ORDER BY timeMs ASC")
    List<DanmakuEntity> getByMediaId(String mediaId);

    @Query("DELETE FROM danmaku WHERE mediaId = :mediaId")
    void deleteByMediaId(String mediaId);

    @Query("DELETE FROM danmaku")
    void clearAll();
}

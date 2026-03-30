package com.localtube.android.data.repository;

import com.localtube.android.data.local.dao.DanmakuDao;
import com.localtube.android.data.local.entity.DanmakuEntity;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

@Singleton
public class DanmakuRepository {

    private final DanmakuDao danmakuDao;

    @Inject
    public DanmakuRepository(DanmakuDao danmakuDao) {
        this.danmakuDao = danmakuDao;
    }

    public List<DanmakuEntity> getDanmakuForMedia(String mediaId) {
        return danmakuDao.getByMediaId(mediaId);
    }

    public void saveDanmaku(String mediaId, String text, int color, int type,
                            long timeMs, String senderName) {
        DanmakuEntity entity = new DanmakuEntity();
        entity.mediaId = mediaId;
        entity.text = text;
        entity.color = color;
        entity.type = type;
        entity.timeMs = timeMs;
        entity.senderName = senderName;
        entity.createdAt = System.currentTimeMillis();
        danmakuDao.insert(entity);
    }

    public void clearForMedia(String mediaId) {
        danmakuDao.deleteByMediaId(mediaId);
    }

    public void clearAll() {
        danmakuDao.clearAll();
    }
}

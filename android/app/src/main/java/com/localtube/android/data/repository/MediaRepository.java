package com.localtube.android.data.repository;

import android.content.SharedPreferences;

import com.localtube.android.data.local.dao.CachedMediaDao;
import com.localtube.android.data.local.dao.WatchHistoryDao;
import com.localtube.android.data.local.entity.WatchHistoryEntity;
import com.localtube.android.data.remote.api.LocalTubeApi;
import com.localtube.android.data.remote.dto.FavoriteResponseDto;
import com.localtube.android.data.remote.dto.LibraryResponseDto;
import com.localtube.android.data.remote.dto.MediaItemDto;
import com.localtube.android.data.remote.dto.StatsDto;
import com.localtube.android.data.remote.dto.WatchProgressDto;
import com.localtube.android.domain.model.MediaItem;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Response;

@Singleton
public class MediaRepository {

    private final LocalTubeApi api;
    private final WatchHistoryDao watchHistoryDao;
    private final CachedMediaDao cachedMediaDao;
    private final SharedPreferences prefs;

    @Inject
    public MediaRepository(LocalTubeApi api,
                           WatchHistoryDao watchHistoryDao,
                           CachedMediaDao cachedMediaDao,
                           SharedPreferences prefs) {
        this.api = api;
        this.watchHistoryDao = watchHistoryDao;
        this.cachedMediaDao = cachedMediaDao;
        this.prefs = prefs;
    }

    public String getServerUrl() {
        return prefs.getString("server_url", "http://192.168.1.100:8000");
    }

    public List<MediaItem> getRecentlyAdded(int count) throws Exception {
        Response<LibraryResponseDto> response = api.getLibrary(
                "all", null, "date", "desc", null, 1, count, null, null
        ).execute();
        if (response.isSuccessful() && response.body() != null) {
            List<MediaItem> items = new ArrayList<>();
            for (MediaItemDto dto : response.body().items) {
                items.add(mapToMediaItem(dto));
            }
            return items;
        }
        throw new Exception("Failed to load: " + response.code());
    }

    public LibraryResponseDto getLibrary(String type, String sort, String order,
                                         String search, int page, int perPage) throws Exception {
        Response<LibraryResponseDto> response = api.getLibrary(
                type, null, sort, order, search, page, perPage, null, null
        ).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body();
        }
        throw new Exception("Failed to load: " + response.code());
    }

    public LibraryResponseDto getLibraryFull(String type, Integer folderId, String sort,
                                             String order, String search, int page, int perPage,
                                             Boolean favoritesOnly, String source) throws Exception {
        Response<LibraryResponseDto> response = api.getLibrary(
                type, folderId, sort, order, search, page, perPage, favoritesOnly, source
        ).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body();
        }
        throw new Exception("Failed to load: " + response.code());
    }

    public MediaItem getMediaItem(String id) throws Exception {
        Response<MediaItemDto> response = api.getMediaItem(id).execute();
        if (response.isSuccessful() && response.body() != null) {
            return mapToMediaItem(response.body());
        }
        throw new Exception("Failed to load media: " + response.code());
    }

    public void recordPlay(String mediaId) {
        try {
            api.recordPlay(mediaId).execute();
        } catch (Exception ignored) {
        }
    }

    public FavoriteResponseDto toggleFavorite(String mediaId) throws Exception {
        Response<FavoriteResponseDto> response = api.toggleFavorite(mediaId).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body();
        }
        throw new Exception("Failed to toggle favorite");
    }

    public void saveWatchProgressToServer(String mediaId, double deltaSeconds,
                                          double positionSeconds, double durationSeconds) {
        try {
            WatchProgressDto body = new WatchProgressDto(
                    deltaSeconds, positionSeconds, durationSeconds);
            api.saveWatchProgress(mediaId, body).execute();
        } catch (Exception ignored) {
        }
    }

    public StatsDto getStats() throws Exception {
        Response<StatsDto> response = api.getStats().execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body();
        }
        throw new Exception("Failed to load stats");
    }

    public List<WatchHistoryEntity> getContinueWatching(int limit) {
        return watchHistoryDao.getRecentHistory(limit);
    }

    public long getWatchPosition(String mediaId) {
        try {
            return watchHistoryDao.getPosition(mediaId);
        } catch (Exception e) {
            return 0;
        }
    }

    public void saveWatchProgressLocal(String mediaId, String title, String thumbnailUrl,
                                       long positionMs, long durationMs) {
        WatchHistoryEntity entity = watchHistoryDao.getByMediaId(mediaId);
        if (entity == null) {
            entity = new WatchHistoryEntity();
            entity.mediaId = mediaId;
        }
        entity.title = title;
        entity.thumbnailUrl = thumbnailUrl;
        entity.positionMs = positionMs;
        entity.durationMs = durationMs;
        entity.progressPercent = durationMs > 0 ? (float) positionMs / durationMs : 0;
        entity.lastWatchedAt = System.currentTimeMillis();
        watchHistoryDao.upsert(entity);
    }

    public void clearWatchHistory() {
        watchHistoryDao.clearAll();
    }

    public static MediaItem mapToMediaItem(MediaItemDto dto) {
        MediaItem item = new MediaItem();
        item.setId(dto.id);
        item.setFolderId(dto.folderId);
        item.setFileName(dto.fileName);
        item.setNameNoExt(dto.nameNoExt);
        item.setExtension(dto.extension);
        item.setMediaType(dto.mediaType);
        item.setFileSize(dto.fileSize);
        item.setFileSizeFormatted(dto.fileSizeFormatted);
        item.setModifiedAt(dto.modifiedAt);
        item.setModifiedRelative(dto.modifiedRelative);
        item.setIndexedAt(dto.indexedAt);
        item.setDurationSeconds(dto.durationSeconds);
        item.setDurationFormatted(dto.durationFormatted);
        item.setWidth(dto.width);
        item.setHeight(dto.height);
        item.setImgWidth(dto.imgWidth);
        item.setImgHeight(dto.imgHeight);
        item.setFps(dto.fps);
        item.setVideoCodec(dto.videoCodec);
        item.setAudioCodec(dto.audioCodec);
        item.setResolutionLabel(dto.resolutionLabel);
        item.setThumbnailStatus(dto.thumbnailStatus);
        item.setThumbnailUrl(dto.thumbnailUrl);
        item.setTranscodeStatus(dto.transcodeStatus);
        item.setStreamUrl(dto.streamUrl);
        item.setTranscodeProgress(dto.transcodeProgress);
        item.setPlayCount(dto.playCount);
        item.setLastPlayed(dto.lastPlayed);
        item.setFavorite(dto.isFavorite);
        item.setFromTelegram(dto.fromTelegram);
        item.setWatchTimeSeconds(dto.watchTimeSeconds);
        item.setLastPositionSeconds(dto.lastPositionSeconds);
        item.setLastWatchAt(dto.lastWatchAt);
        item.setTags(dto.tags);
        return item;
    }
}

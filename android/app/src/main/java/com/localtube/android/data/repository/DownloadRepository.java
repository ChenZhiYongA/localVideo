package com.localtube.android.data.repository;

import android.content.Context;

import androidx.lifecycle.LiveData;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import com.localtube.android.data.local.dao.DownloadDao;
import com.localtube.android.data.local.entity.DownloadEntity;
import com.localtube.android.feature.downloads.DownloadWorker;

import java.io.File;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import dagger.hilt.android.qualifiers.ApplicationContext;

@Singleton
public class DownloadRepository {

    private final DownloadDao downloadDao;
    private final Context context;
    private static final String TAG_DOWNLOADS = "localtube_downloads";

    @Inject
    public DownloadRepository(DownloadDao downloadDao,
                              @ApplicationContext Context context) {
        this.downloadDao = downloadDao;
        this.context = context;
    }

    public LiveData<List<DownloadEntity>> getAllDownloadsLive() {
        return downloadDao.getAllLive();
    }

    public List<DownloadEntity> getAllDownloads() {
        return downloadDao.getAll();
    }

    public DownloadEntity getDownload(String mediaId) {
        return downloadDao.getByMediaId(mediaId);
    }

    public void startDownload(String mediaId, String title, String thumbnailUrl,
                              String streamUrl, String filename, long totalBytes,
                              boolean wifiOnly) {
        DownloadEntity entity = new DownloadEntity();
        entity.mediaId = mediaId;
        entity.title = title;
        entity.thumbnailUrl = thumbnailUrl;
        entity.streamUrl = streamUrl;
        entity.filename = filename;
        entity.totalBytes = totalBytes;
        entity.downloadedBytes = 0;
        entity.status = "pending";
        entity.createdAt = System.currentTimeMillis();
        downloadDao.upsert(entity);

        Data data = new Data.Builder()
                .putString(DownloadWorker.KEY_MEDIA_ID, mediaId)
                .putString(DownloadWorker.KEY_STREAM_URL, streamUrl)
                .putString(DownloadWorker.KEY_FILENAME, filename)
                .putLong(DownloadWorker.KEY_TOTAL_BYTES, totalBytes)
                .build();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(
                        wifiOnly ? NetworkType.UNMETERED : NetworkType.CONNECTED
                ).build();

        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(DownloadWorker.class)
                .setInputData(data)
                .setConstraints(constraints)
                .addTag(TAG_DOWNLOADS)
                .build();

        WorkManager.getInstance(context)
                .enqueueUniqueWork("download_" + mediaId,
                        ExistingWorkPolicy.KEEP, request);
    }

    public void pauseDownload(String mediaId) {
        WorkManager.getInstance(context).cancelUniqueWork("download_" + mediaId);
        downloadDao.updateProgress(mediaId,
                downloadDao.getByMediaId(mediaId).downloadedBytes, "paused");
    }

    public void resumeDownload(String mediaId) {
        DownloadEntity entity = downloadDao.getByMediaId(mediaId);
        if (entity == null) return;

        entity.status = "pending";
        downloadDao.update(entity);

        Data data = new Data.Builder()
                .putString(DownloadWorker.KEY_MEDIA_ID, mediaId)
                .putString(DownloadWorker.KEY_STREAM_URL, entity.streamUrl)
                .putString(DownloadWorker.KEY_FILENAME, entity.filename)
                .putLong(DownloadWorker.KEY_TOTAL_BYTES, entity.totalBytes)
                .build();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(DownloadWorker.class)
                .setInputData(data)
                .setConstraints(constraints)
                .addTag(TAG_DOWNLOADS)
                .build();

        WorkManager.getInstance(context)
                .enqueueUniqueWork("download_" + mediaId,
                        ExistingWorkPolicy.REPLACE, request);
    }

    public void deleteDownload(String mediaId) {
        WorkManager.getInstance(context).cancelUniqueWork("download_" + mediaId);
        DownloadEntity entity = downloadDao.getByMediaId(mediaId);
        if (entity != null && entity.filePath != null) {
            File file = new File(entity.filePath);
            if (file.exists()) {
                file.delete();
            }
        }
        downloadDao.delete(mediaId);
    }

    public void clearAll() {
        WorkManager.getInstance(context).cancelAllWorkByTag(TAG_DOWNLOADS);
        List<DownloadEntity> all = downloadDao.getAll();
        for (DownloadEntity entity : all) {
            if (entity.filePath != null) {
                File file = new File(entity.filePath);
                if (file.exists()) {
                    file.delete();
                }
            }
        }
        downloadDao.clearAll();
    }

    public long getStorageUsed() {
        long total = 0;
        List<DownloadEntity> all = downloadDao.getAll();
        for (DownloadEntity e : all) {
            if (e.filePath != null) {
                File file = new File(e.filePath);
                if (file.exists()) {
                    total += file.length();
                }
            }
        }
        return total;
    }
}

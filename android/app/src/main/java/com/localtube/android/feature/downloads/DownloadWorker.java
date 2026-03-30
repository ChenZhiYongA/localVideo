package com.localtube.android.feature.downloads;

import android.app.NotificationManager;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.hilt.work.HiltWorker;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.localtube.android.R;
import com.localtube.android.data.local.dao.DownloadDao;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

import dagger.assisted.Assisted;
import dagger.assisted.AssistedInject;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@HiltWorker
public class DownloadWorker extends Worker {

    public static final String KEY_MEDIA_ID = "media_id";
    public static final String KEY_STREAM_URL = "stream_url";
    public static final String KEY_FILENAME = "filename";
    public static final String KEY_TOTAL_BYTES = "total_bytes";
    public static final String KEY_PROGRESS = "progress";
    public static final String KEY_BYTES_DONE = "bytes_done";

    private final OkHttpClient client;
    private final DownloadDao downloadDao;
    private static final int NOTIFICATION_ID_BASE = 10000;

    @AssistedInject
    public DownloadWorker(
            @Assisted @NonNull Context context,
            @Assisted @NonNull WorkerParameters params,
            OkHttpClient client,
            DownloadDao downloadDao) {
        super(context, params);
        this.client = client;
        this.downloadDao = downloadDao;
    }

    @NonNull
    @Override
    public Result doWork() {
        String mediaId = getInputData().getString(KEY_MEDIA_ID);
        String streamUrl = getInputData().getString(KEY_STREAM_URL);
        String filename = getInputData().getString(KEY_FILENAME);
        long totalBytes = getInputData().getLong(KEY_TOTAL_BYTES, 0);

        if (mediaId == null || streamUrl == null || filename == null) {
            return Result.failure();
        }

        File dir = new File(getApplicationContext().getExternalFilesDir(null), "downloads/videos");
        if (!dir.exists()) dir.mkdirs();
        File outputFile = new File(dir, filename);

        long resumeOffset = 0;
        var entity = downloadDao.getByMediaId(mediaId);
        if (entity != null) {
            resumeOffset = entity.downloadedBytes;
            if (!outputFile.exists() || outputFile.length() != resumeOffset) {
                resumeOffset = 0;
            }
        }

        try {
            downloadDao.updateProgress(mediaId, resumeOffset, "downloading");

            Request.Builder requestBuilder = new Request.Builder().url(streamUrl);
            if (resumeOffset > 0) {
                requestBuilder.addHeader("Range", "bytes=" + resumeOffset + "-");
            }

            Response response = client.newCall(requestBuilder.build()).execute();
            if (!response.isSuccessful() || response.body() == null) {
                downloadDao.updateProgress(mediaId, resumeOffset, "failed");
                return Result.failure();
            }

            FileOutputStream fos = new FileOutputStream(outputFile, resumeOffset > 0);
            InputStream in = response.body().byteStream();
            byte[] buffer = new byte[65536];
            int read;
            long downloaded = resumeOffset;
            int lastNotifiedProgress = -1;

            NotificationManager nm = (NotificationManager)
                    getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

            while ((read = in.read(buffer)) != -1) {
                if (isStopped()) {
                    fos.close();
                    in.close();
                    downloadDao.updateProgress(mediaId, downloaded, "paused");
                    return Result.success();
                }
                fos.write(buffer, 0, read);
                downloaded += read;

                int progress = totalBytes > 0 ? (int) (downloaded * 100 / totalBytes) : 0;

                if (progress != lastNotifiedProgress && progress % 5 == 0) {
                    lastNotifiedProgress = progress;
                    downloadDao.updateProgress(mediaId, downloaded, "downloading");

                    setProgressAsync(new Data.Builder()
                            .putInt(KEY_PROGRESS, progress)
                            .putLong(KEY_BYTES_DONE, downloaded)
                            .build());

                    NotificationCompat.Builder nb = new NotificationCompat.Builder(
                            getApplicationContext(), "downloads")
                            .setSmallIcon(R.drawable.ic_download)
                            .setContentTitle(filename)
                            .setProgress(100, progress, false)
                            .setOngoing(true)
                            .setSilent(true);
                    nm.notify(NOTIFICATION_ID_BASE + mediaId.hashCode(), nb.build());
                }
            }

            fos.close();
            in.close();

            entity = downloadDao.getByMediaId(mediaId);
            if (entity != null) {
                entity.downloadedBytes = downloaded;
                entity.status = "done";
                entity.filePath = outputFile.getAbsolutePath();
                entity.completedAt = System.currentTimeMillis();
                downloadDao.update(entity);
            }

            nm.cancel(NOTIFICATION_ID_BASE + mediaId.hashCode());

            NotificationCompat.Builder done = new NotificationCompat.Builder(
                    getApplicationContext(), "downloads")
                    .setSmallIcon(R.drawable.ic_download)
                    .setContentTitle(filename)
                    .setContentText("Download complete")
                    .setAutoCancel(true);
            nm.notify(NOTIFICATION_ID_BASE + mediaId.hashCode() + 1, done.build());

            return Result.success();

        } catch (Exception e) {
            downloadDao.updateProgress(mediaId, 0, "failed");
            return Result.failure();
        }
    }
}

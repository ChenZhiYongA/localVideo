package com.localtube.android;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.hilt.work.HiltWorkerFactory;
import androidx.work.Configuration;

import javax.inject.Inject;

import dagger.hilt.android.HiltAndroidApp;

@HiltAndroidApp
public class LocalTubeApp extends Application implements Configuration.Provider {

    @Inject
    HiltWorkerFactory workerFactory;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            NotificationChannel playbackChannel = new NotificationChannel(
                    "playback",
                    getString(R.string.notification_channel_playback),
                    NotificationManager.IMPORTANCE_LOW
            );
            playbackChannel.setDescription("Media playback controls");
            manager.createNotificationChannel(playbackChannel);

            NotificationChannel downloadChannel = new NotificationChannel(
                    "downloads",
                    getString(R.string.notification_channel_downloads),
                    NotificationManager.IMPORTANCE_LOW
            );
            downloadChannel.setDescription("Download progress");
            manager.createNotificationChannel(downloadChannel);
        }
    }

    @NonNull
    @Override
    public Configuration getWorkManagerConfiguration() {
        return new Configuration.Builder()
                .setWorkerFactory(workerFactory)
                .build();
    }
}

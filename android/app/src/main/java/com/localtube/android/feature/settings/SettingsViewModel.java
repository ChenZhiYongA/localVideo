package com.localtube.android.feature.settings;

import android.content.SharedPreferences;

import com.localtube.android.data.repository.DownloadRepository;
import com.localtube.android.data.repository.MediaRepository;
import com.localtube.android.ui.common.AppExecutors;
import com.localtube.android.ui.common.BaseViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class SettingsViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final DownloadRepository downloadRepository;
    private final AppExecutors executors;
    private final SharedPreferences prefs;

    @Inject
    public SettingsViewModel(MediaRepository mediaRepository,
                             DownloadRepository downloadRepository,
                             AppExecutors executors,
                             SharedPreferences prefs) {
        this.mediaRepository = mediaRepository;
        this.downloadRepository = downloadRepository;
        this.executors = executors;
        this.prefs = prefs;
    }

    public void clearWatchHistory() {
        executors.diskIO().execute(mediaRepository::clearWatchHistory);
    }

    public void clearDownloads() {
        executors.diskIO().execute(downloadRepository::clearAll);
    }

    public long getStorageUsed() {
        return downloadRepository.getStorageUsed();
    }

    public String getServerUrl() {
        return prefs.getString("server_url", "");
    }
}

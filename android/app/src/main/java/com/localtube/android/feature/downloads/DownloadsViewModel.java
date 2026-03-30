package com.localtube.android.feature.downloads;

import androidx.lifecycle.LiveData;

import com.localtube.android.data.local.entity.DownloadEntity;
import com.localtube.android.data.repository.DownloadRepository;
import com.localtube.android.data.repository.MediaRepository;
import com.localtube.android.ui.common.AppExecutors;
import com.localtube.android.ui.common.BaseViewModel;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class DownloadsViewModel extends BaseViewModel {

    private final DownloadRepository downloadRepository;
    private final MediaRepository mediaRepository;
    private final AppExecutors executors;

    @Inject
    public DownloadsViewModel(DownloadRepository downloadRepository,
                              MediaRepository mediaRepository,
                              AppExecutors executors) {
        this.downloadRepository = downloadRepository;
        this.mediaRepository = mediaRepository;
        this.executors = executors;
    }

    public LiveData<List<DownloadEntity>> getDownloads() {
        return downloadRepository.getAllDownloadsLive();
    }

    public void pauseResume(DownloadEntity entity) {
        executors.diskIO().execute(() -> {
            if ("downloading".equals(entity.status) || "pending".equals(entity.status)) {
                downloadRepository.pauseDownload(entity.mediaId);
            } else if ("paused".equals(entity.status) || "failed".equals(entity.status)) {
                downloadRepository.resumeDownload(entity.mediaId);
            }
        });
    }

    public void deleteDownload(DownloadEntity entity) {
        executors.diskIO().execute(() ->
                downloadRepository.deleteDownload(entity.mediaId));
    }

    public String getServerUrl() { return mediaRepository.getServerUrl(); }
}

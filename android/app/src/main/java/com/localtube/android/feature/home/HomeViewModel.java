package com.localtube.android.feature.home;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.localtube.android.data.local.entity.WatchHistoryEntity;
import com.localtube.android.data.repository.MediaRepository;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.common.AppExecutors;
import com.localtube.android.ui.common.BaseViewModel;
import com.localtube.android.ui.common.Resource;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class HomeViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final AppExecutors executors;

    private final MutableLiveData<List<WatchHistoryEntity>> continueWatching = new MutableLiveData<>();
    private final MutableLiveData<Resource<List<MediaItem>>> recentlyAdded = new MutableLiveData<>();

    @Inject
    public HomeViewModel(MediaRepository repository, AppExecutors executors) {
        this.mediaRepository = repository;
        this.executors = executors;
        loadData();
    }

    private void loadData() {
        recentlyAdded.setValue(Resource.loading(null));

        executors.diskIO().execute(() -> {
            List<WatchHistoryEntity> history = mediaRepository.getContinueWatching(10);
            executors.mainThread().execute(() -> continueWatching.setValue(history));
        });

        executors.networkIO().execute(() -> {
            try {
                List<MediaItem> items = mediaRepository.getRecentlyAdded(20);
                executors.mainThread().execute(() ->
                        recentlyAdded.setValue(Resource.success(items)));
            } catch (Exception e) {
                executors.mainThread().execute(() ->
                        recentlyAdded.setValue(Resource.error(e.getMessage(), null)));
            }
        });
    }

    public LiveData<List<WatchHistoryEntity>> getContinueWatching() { return continueWatching; }
    public LiveData<Resource<List<MediaItem>>> getRecentlyAdded() { return recentlyAdded; }
    public String getServerUrl() { return mediaRepository.getServerUrl(); }
    public void refresh() { loadData(); }
}

package com.localtube.android.feature.shorts;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.localtube.android.data.remote.dto.LibraryResponseDto;
import com.localtube.android.data.repository.MediaRepository;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.common.AppExecutors;
import com.localtube.android.ui.common.BaseViewModel;
import com.localtube.android.ui.common.Resource;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ShortsViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final AppExecutors executors;
    private final MutableLiveData<Resource<List<MediaItem>>> shorts = new MutableLiveData<>();

    @Inject
    public ShortsViewModel(MediaRepository repository, AppExecutors executors) {
        this.mediaRepository = repository;
        this.executors = executors;
        loadShorts();
    }

    private void loadShorts() {
        shorts.setValue(Resource.loading(null));
        executors.networkIO().execute(() -> {
            try {
                LibraryResponseDto response = mediaRepository.getLibrary(
                        "video", "created_at", "desc", null, 1, 50);
                List<MediaItem> items = new ArrayList<>();
                for (var dto : response.items) {
                    MediaItem item = MediaRepository.mapToMediaItem(dto);
                    if (item.getDurationMs() > 0 && item.getDurationMs() <= 180000) {
                        items.add(item);
                    }
                }
                executors.mainThread().execute(() -> shorts.setValue(Resource.success(items)));
            } catch (Exception e) {
                executors.mainThread().execute(() ->
                        shorts.setValue(Resource.error(e.getMessage(), null)));
            }
        });
    }

    public LiveData<Resource<List<MediaItem>>> getShorts() { return shorts; }
    public String getServerUrl() { return mediaRepository.getServerUrl(); }
    public void refresh() { loadShorts(); }
}

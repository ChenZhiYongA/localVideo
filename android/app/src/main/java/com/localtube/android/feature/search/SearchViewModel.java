package com.localtube.android.feature.search;

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
public class SearchViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final AppExecutors executors;
    private final MutableLiveData<Resource<List<MediaItem>>> results = new MutableLiveData<>();

    @Inject
    public SearchViewModel(MediaRepository repository, AppExecutors executors) {
        this.mediaRepository = repository;
        this.executors = executors;
    }

    public void search(String query) {
        if (query == null || query.trim().isEmpty()) {
            results.setValue(Resource.success(new ArrayList<>()));
            return;
        }

        results.setValue(Resource.loading(null));
        executors.networkIO().execute(() -> {
            try {
                LibraryResponseDto response = mediaRepository.getLibrary(
                        null, "created_at", "desc", query.trim(), 1, 50);
                List<MediaItem> items = new ArrayList<>();
                for (var dto : response.items) {
                    items.add(MediaRepository.mapToMediaItem(dto));
                }
                executors.mainThread().execute(() -> results.setValue(Resource.success(items)));
            } catch (Exception e) {
                executors.mainThread().execute(() ->
                        results.setValue(Resource.error(e.getMessage(), null)));
            }
        });
    }

    public LiveData<Resource<List<MediaItem>>> getResults() { return results; }
    public String getServerUrl() { return mediaRepository.getServerUrl(); }
}

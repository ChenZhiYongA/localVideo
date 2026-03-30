package com.localtube.android.feature.library;

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
public class LibraryViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final AppExecutors executors;

    private final MutableLiveData<Resource<List<MediaItem>>> mediaItems = new MutableLiveData<>();
    private final MutableLiveData<Boolean> isGridView = new MutableLiveData<>(true);

    private String currentType = null;
    private String currentSort = "created_at";
    private String currentOrder = "desc";
    private String currentSearch = null;
    private int currentPage = 1;
    private int totalPages = 1;
    private boolean isLoading = false;

    @Inject
    public LibraryViewModel(MediaRepository repository, AppExecutors executors) {
        this.mediaRepository = repository;
        this.executors = executors;
        loadMedia(true);
    }

    public void loadMedia(boolean refresh) {
        if (isLoading) return;
        if (refresh) {
            currentPage = 1;
        } else if (currentPage >= totalPages) {
            return;
        } else {
            currentPage++;
        }
        isLoading = true;

        if (refresh) {
            mediaItems.setValue(Resource.loading(null));
        }

        executors.networkIO().execute(() -> {
            try {
                LibraryResponseDto response = mediaRepository.getLibrary(
                        currentType, currentSort, currentOrder,
                        currentSearch, currentPage, 30);
                totalPages = response.totalPages;
                List<MediaItem> items = new ArrayList<>();
                for (var dto : response.items) {
                    items.add(MediaRepository.mapToMediaItem(dto));
                }
                executors.mainThread().execute(() -> {
                    if (refresh) {
                        mediaItems.setValue(Resource.success(items));
                    } else {
                        Resource<List<MediaItem>> current = mediaItems.getValue();
                        List<MediaItem> combined = new ArrayList<>();
                        if (current != null && current.data != null) {
                            combined.addAll(current.data);
                        }
                        combined.addAll(items);
                        mediaItems.setValue(Resource.success(combined));
                    }
                    isLoading = false;
                });
            } catch (Exception e) {
                executors.mainThread().execute(() -> {
                    mediaItems.setValue(Resource.error(e.getMessage(), null));
                    isLoading = false;
                });
            }
        });
    }

    public void setFilter(String type) {
        this.currentType = type;
        loadMedia(true);
    }

    public void setSort(String sort, String order) {
        this.currentSort = sort;
        this.currentOrder = order;
        loadMedia(true);
    }

    public void setSearch(String search) {
        this.currentSearch = search;
        loadMedia(true);
    }

    public void toggleViewMode() {
        Boolean current = isGridView.getValue();
        isGridView.setValue(current == null || !current);
    }

    public LiveData<Resource<List<MediaItem>>> getMediaItems() { return mediaItems; }
    public LiveData<Boolean> getIsGridView() { return isGridView; }
    public String getServerUrl() { return mediaRepository.getServerUrl(); }
    public boolean canLoadMore() { return currentPage < totalPages && !isLoading; }
}

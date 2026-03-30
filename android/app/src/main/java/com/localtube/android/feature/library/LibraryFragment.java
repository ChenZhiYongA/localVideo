package com.localtube.android.feature.library;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.localtube.android.R;
import com.localtube.android.databinding.FragmentLibraryBinding;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.adapter.MediaGridAdapter;
import com.localtube.android.ui.adapter.MediaListAdapter;
import com.localtube.android.ui.common.BaseFragment;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class LibraryFragment extends BaseFragment {

    private FragmentLibraryBinding binding;
    private LibraryViewModel viewModel;
    private MediaGridAdapter gridAdapter;
    private MediaListAdapter listAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentLibraryBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(LibraryViewModel.class);

        gridAdapter = new MediaGridAdapter(this::navigateToPlayer);
        gridAdapter.setServerUrl(viewModel.getServerUrl());
        listAdapter = new MediaListAdapter(this::navigateToPlayer);
        listAdapter.setServerUrl(viewModel.getServerUrl());

        binding.recyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.recyclerView.setAdapter(gridAdapter);

        binding.swipeRefresh.setOnRefreshListener(() -> viewModel.loadMedia(true));
        binding.swipeRefresh.setColorSchemeResources(R.color.lt_red);

        binding.chipAll.setOnClickListener(v -> viewModel.setFilter(null));
        binding.chipVideo.setOnClickListener(v -> viewModel.setFilter("video"));
        binding.chipAudio.setOnClickListener(v -> viewModel.setFilter("audio"));

        binding.btnViewToggle.setOnClickListener(v -> viewModel.toggleViewMode());

        binding.btnSort.setOnClickListener(v -> {});

        if (binding.btnRetry != null) {
            binding.btnRetry.setOnClickListener(v -> viewModel.loadMedia(true));
        }

        binding.recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView rv, int dx, int dy) {
                if (dy > 0 && viewModel.canLoadMore()) {
                    RecyclerView.LayoutManager lm = rv.getLayoutManager();
                    int total = lm != null ? lm.getItemCount() : 0;
                    int lastVisible;
                    if (lm instanceof GridLayoutManager) {
                        lastVisible = ((GridLayoutManager) lm).findLastVisibleItemPosition();
                    } else {
                        lastVisible = ((LinearLayoutManager) lm).findLastVisibleItemPosition();
                    }
                    if (lastVisible >= total - 5) {
                        viewModel.loadMedia(false);
                    }
                }
            }
        });
    }

    @Override
    protected void observeData() {
        viewModel.getMediaItems().observe(getViewLifecycleOwner(), resource -> {
            binding.swipeRefresh.setRefreshing(false);
            switch (resource.status) {
                case LOADING:
                    binding.shimmerLayout.setVisibility(View.VISIBLE);
                    binding.shimmerLayout.startShimmer();
                    binding.recyclerView.setVisibility(View.GONE);
                    binding.emptyLayout.setVisibility(View.GONE);
                    binding.errorLayout.setVisibility(View.GONE);
                    break;
                case SUCCESS:
                    binding.shimmerLayout.stopShimmer();
                    binding.shimmerLayout.setVisibility(View.GONE);
                    binding.errorLayout.setVisibility(View.GONE);
                    if (resource.data == null || resource.data.isEmpty()) {
                        binding.recyclerView.setVisibility(View.GONE);
                        binding.emptyLayout.setVisibility(View.VISIBLE);
                    } else {
                        binding.recyclerView.setVisibility(View.VISIBLE);
                        binding.emptyLayout.setVisibility(View.GONE);
                        gridAdapter.submitList(resource.data);
                        listAdapter.submitList(resource.data);
                    }
                    break;
                case ERROR:
                    binding.shimmerLayout.stopShimmer();
                    binding.shimmerLayout.setVisibility(View.GONE);
                    binding.recyclerView.setVisibility(View.GONE);
                    binding.emptyLayout.setVisibility(View.GONE);
                    binding.errorLayout.setVisibility(View.VISIBLE);
                    break;
            }
        });

        viewModel.getIsGridView().observe(getViewLifecycleOwner(), isGrid -> {
            if (isGrid) {
                binding.recyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 2));
                binding.recyclerView.setAdapter(gridAdapter);
                binding.btnViewToggle.setImageResource(R.drawable.ic_grid_view);
            } else {
                binding.recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
                binding.recyclerView.setAdapter(listAdapter);
                binding.btnViewToggle.setImageResource(R.drawable.ic_list_view);
            }
        });
    }

    private void navigateToPlayer(MediaItem item) {
        Bundle args = new Bundle();
        args.putString("mediaId", item.getId());
        Navigation.findNavController(requireView())
                .navigate(R.id.action_library_to_player, args);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

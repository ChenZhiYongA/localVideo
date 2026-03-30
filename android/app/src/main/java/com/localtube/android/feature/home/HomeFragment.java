package com.localtube.android.feature.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.GridLayoutManager;

import com.localtube.android.R;
import com.localtube.android.databinding.FragmentHomeBinding;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.adapter.MediaGridAdapter;
import com.localtube.android.ui.common.BaseFragment;
import com.localtube.android.ui.common.Resource;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class HomeFragment extends BaseFragment {

    private FragmentHomeBinding binding;
    private HomeViewModel viewModel;
    private MediaGridAdapter recentAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(HomeViewModel.class);

        recentAdapter = new MediaGridAdapter(this::navigateToPlayer);
        recentAdapter.setServerUrl(viewModel.getServerUrl());
        binding.rvRecentlyAdded.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.rvRecentlyAdded.setAdapter(recentAdapter);

        binding.swipeRefresh.setOnRefreshListener(() -> viewModel.refresh());
        binding.swipeRefresh.setColorSchemeResources(R.color.lt_red);

        binding.toolbar.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.action_search) {
                Navigation.findNavController(view).navigate(R.id.searchFragment);
                return true;
            } else if (item.getItemId() == R.id.action_settings) {
                Navigation.findNavController(view).navigate(R.id.settingsFragment);
                return true;
            }
            return false;
        });

        if (binding.btnRetry != null) {
            binding.btnRetry.setOnClickListener(v -> viewModel.refresh());
        }
    }

    @Override
    protected void observeData() {
        viewModel.getRecentlyAdded().observe(getViewLifecycleOwner(), resource -> {
            binding.swipeRefresh.setRefreshing(false);

            switch (resource.status) {
                case LOADING:
                    binding.shimmerLayout.setVisibility(View.VISIBLE);
                    binding.shimmerLayout.startShimmer();
                    binding.rvRecentlyAdded.setVisibility(View.GONE);
                    binding.errorLayout.setVisibility(View.GONE);
                    break;
                case SUCCESS:
                    binding.shimmerLayout.stopShimmer();
                    binding.shimmerLayout.setVisibility(View.GONE);
                    binding.rvRecentlyAdded.setVisibility(View.VISIBLE);
                    binding.errorLayout.setVisibility(View.GONE);
                    if (resource.data != null) {
                        recentAdapter.submitList(resource.data);
                    }
                    break;
                case ERROR:
                    binding.shimmerLayout.stopShimmer();
                    binding.shimmerLayout.setVisibility(View.GONE);
                    binding.rvRecentlyAdded.setVisibility(View.GONE);
                    binding.errorLayout.setVisibility(View.VISIBLE);
                    break;
            }
        });

        viewModel.getContinueWatching().observe(getViewLifecycleOwner(), history -> {
            boolean hasHistory = history != null && !history.isEmpty();
            binding.tvContinueWatchingLabel.setVisibility(hasHistory ? View.VISIBLE : View.GONE);
            binding.rvContinueWatching.setVisibility(hasHistory ? View.VISIBLE : View.GONE);
        });
    }

    private void navigateToPlayer(MediaItem item) {
        Bundle args = new Bundle();
        args.putString("mediaId", item.getId());
        Navigation.findNavController(requireView())
                .navigate(R.id.action_home_to_player, args);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

package com.localtube.android.feature.downloads;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.localtube.android.R;
import com.localtube.android.data.local.entity.DownloadEntity;
import com.localtube.android.databinding.FragmentDownloadsBinding;
import com.localtube.android.ui.adapter.DownloadAdapter;
import com.localtube.android.ui.common.BaseFragment;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class DownloadsFragment extends BaseFragment {

    private FragmentDownloadsBinding binding;
    private DownloadsViewModel viewModel;
    private DownloadAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentDownloadsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(DownloadsViewModel.class);

        adapter = new DownloadAdapter(new DownloadAdapter.OnDownloadActionListener() {
            @Override
            public void onPauseResume(DownloadEntity entity) {
                viewModel.pauseResume(entity);
            }

            @Override
            public void onDelete(DownloadEntity entity) {
                new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                        .setTitle(R.string.delete_download)
                        .setPositiveButton(R.string.delete, (d, w) -> viewModel.deleteDownload(entity))
                        .setNegativeButton(R.string.cancel, null)
                        .show();
            }

            @Override
            public void onItemClick(DownloadEntity entity) {
                if ("done".equals(entity.status)) {
                    Bundle args = new Bundle();
                    args.putString("mediaId", entity.mediaId);
                    Navigation.findNavController(requireView())
                            .navigate(R.id.action_downloads_to_player, args);
                }
            }
        });
        adapter.setServerUrl(viewModel.getServerUrl());

        binding.recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recyclerView.setAdapter(adapter);
    }

    @Override
    protected void observeData() {
        viewModel.getDownloads().observe(getViewLifecycleOwner(), downloads -> {
            if (downloads == null || downloads.isEmpty()) {
                binding.recyclerView.setVisibility(View.GONE);
                binding.emptyLayout.setVisibility(View.VISIBLE);
            } else {
                binding.recyclerView.setVisibility(View.VISIBLE);
                binding.emptyLayout.setVisibility(View.GONE);
                adapter.submitList(downloads);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

package com.localtube.android.feature.search;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.localtube.android.R;
import com.localtube.android.databinding.FragmentSearchBinding;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.adapter.MediaListAdapter;
import com.localtube.android.ui.common.BaseFragment;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class SearchFragment extends BaseFragment {

    private FragmentSearchBinding binding;
    private SearchViewModel viewModel;
    private MediaListAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentSearchBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(SearchViewModel.class);

        adapter = new MediaListAdapter(this::navigateToPlayer);
        adapter.setServerUrl(viewModel.getServerUrl());
        binding.recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recyclerView.setAdapter(adapter);

        binding.toolbar.setNavigationOnClickListener(v ->
                Navigation.findNavController(view).navigateUp());

        binding.etSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                String query = binding.etSearch.getText() != null
                        ? binding.etSearch.getText().toString() : "";
                viewModel.search(query);
                return true;
            }
            return false;
        });

        String query = getArguments() != null ? getArguments().getString("query", "") : "";
        if (!query.isEmpty()) {
            binding.etSearch.setText(query);
            viewModel.search(query);
        }

        binding.etSearch.requestFocus();
    }

    @Override
    protected void observeData() {
        viewModel.getResults().observe(getViewLifecycleOwner(), resource -> {
            switch (resource.status) {
                case LOADING:
                    binding.recyclerView.setVisibility(View.GONE);
                    binding.emptyLayout.setVisibility(View.GONE);
                    break;
                case SUCCESS:
                    if (resource.data == null || resource.data.isEmpty()) {
                        binding.recyclerView.setVisibility(View.GONE);
                        binding.emptyLayout.setVisibility(View.VISIBLE);
                    } else {
                        binding.recyclerView.setVisibility(View.VISIBLE);
                        binding.emptyLayout.setVisibility(View.GONE);
                        adapter.submitList(resource.data);
                    }
                    break;
                case ERROR:
                    binding.recyclerView.setVisibility(View.GONE);
                    binding.emptyLayout.setVisibility(View.VISIBLE);
                    break;
            }
        });
    }

    private void navigateToPlayer(MediaItem item) {
        Bundle args = new Bundle();
        args.putString("mediaId", item.getId());
        Navigation.findNavController(requireView())
                .navigate(R.id.action_search_to_player, args);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

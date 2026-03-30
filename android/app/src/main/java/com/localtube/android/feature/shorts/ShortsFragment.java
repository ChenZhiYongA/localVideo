package com.localtube.android.feature.shorts;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;

import com.localtube.android.databinding.FragmentShortsBinding;
import com.localtube.android.ui.adapter.ShortsFeedAdapter;
import com.localtube.android.ui.common.BaseFragment;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ShortsFragment extends BaseFragment {

    private FragmentShortsBinding binding;
    private ShortsViewModel viewModel;
    private ShortsFeedAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentShortsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(ShortsViewModel.class);

        adapter = new ShortsFeedAdapter(this);
        binding.viewPager.setAdapter(adapter);
        binding.viewPager.setOffscreenPageLimit(1);

        View child = binding.viewPager.getChildAt(0);
        if (child instanceof RecyclerView) {
            ((RecyclerView) child).setOverScrollMode(View.OVER_SCROLL_NEVER);
        }

        binding.viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
            }
        });
    }

    @Override
    protected void observeData() {
        viewModel.getShorts().observe(getViewLifecycleOwner(), resource -> {
            if (resource.status == com.localtube.android.ui.common.Resource.Status.SUCCESS
                    && resource.data != null) {
                adapter.submitList(resource.data);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

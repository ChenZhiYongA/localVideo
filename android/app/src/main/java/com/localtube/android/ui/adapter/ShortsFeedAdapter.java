package com.localtube.android.ui.adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.feature.shorts.ShortPageFragment;

import java.util.ArrayList;
import java.util.List;

public class ShortsFeedAdapter extends FragmentStateAdapter {

    private List<MediaItem> items = new ArrayList<>();

    public ShortsFeedAdapter(@NonNull Fragment fragment) {
        super(fragment);
    }

    public void submitList(List<MediaItem> newItems) {
        this.items = newItems != null ? newItems : new ArrayList<>();
        notifyDataSetChanged();
    }

    public MediaItem getItemAt(int position) {
        if (position >= 0 && position < items.size()) {
            return items.get(position);
        }
        return null;
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        MediaItem item = items.get(position);
        return ShortPageFragment.newInstance(item.getId(), item.getTitle(), item.getPath());
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    @Override
    public long getItemId(int position) {
        return items.get(position).getId().hashCode();
    }

    @Override
    public boolean containsItem(long itemId) {
        for (MediaItem item : items) {
            if (item.getId().hashCode() == itemId) return true;
        }
        return false;
    }
}

package com.localtube.android.ui.adapter;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;
import com.localtube.android.R;
import com.localtube.android.databinding.ItemMediaListBinding;
import com.localtube.android.domain.model.MediaItem;

public class MediaListAdapter extends ListAdapter<MediaItem, MediaListAdapter.ViewHolder> {

    private final OnItemClickListener listener;
    private String serverUrl = "";

    public interface OnItemClickListener {
        void onItemClick(MediaItem item);
    }

    public MediaListAdapter(OnItemClickListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
        setHasStableIds(true);
    }

    public void setServerUrl(String url) {
        this.serverUrl = url;
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).getId().hashCode();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemMediaListBinding binding = ItemMediaListBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemMediaListBinding binding;

        ViewHolder(ItemMediaListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(MediaItem item) {
            binding.tvTitle.setText(item.getTitle());
            binding.tvDuration.setText(item.getFormattedDuration());
            binding.tvInfo.setText(item.getFormattedSize());

            String thumbUrl = item.getThumbnailUrl();
            if (thumbUrl != null && !thumbUrl.startsWith("http")) {
                thumbUrl = serverUrl + thumbUrl;
            }
            Glide.with(binding.ivThumbnail.getContext())
                    .load(thumbUrl)
                    .placeholder(R.drawable.bg_card_surface)
                    .error(R.drawable.ic_broken_image)
                    .transition(DrawableTransitionOptions.withCrossFade(300))
                    .centerCrop()
                    .into(binding.ivThumbnail);

            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) listener.onItemClick(item);
            });
        }
    }

    private static final DiffUtil.ItemCallback<MediaItem> DIFF_CALLBACK =
            new DiffUtil.ItemCallback<MediaItem>() {
                @Override
                public boolean areItemsTheSame(@NonNull MediaItem o, @NonNull MediaItem n) {
                    return o.getId().equals(n.getId());
                }

                @Override
                public boolean areContentsTheSame(@NonNull MediaItem o, @NonNull MediaItem n) {
                    return o.getId().equals(n.getId())
                            && o.getTitle().equals(n.getTitle());
                }
            };
}

package com.localtube.android.ui.adapter;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.localtube.android.R;
import com.localtube.android.data.local.entity.DownloadEntity;
import com.localtube.android.databinding.ItemDownloadBinding;

public class DownloadAdapter extends ListAdapter<DownloadEntity, DownloadAdapter.ViewHolder> {

    private final OnDownloadActionListener listener;
    private String serverUrl = "";

    public interface OnDownloadActionListener {
        void onPauseResume(DownloadEntity entity);
        void onDelete(DownloadEntity entity);
        void onItemClick(DownloadEntity entity);
    }

    public DownloadAdapter(OnDownloadActionListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
    }

    public void setServerUrl(String url) {
        this.serverUrl = url;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemDownloadBinding binding = ItemDownloadBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemDownloadBinding binding;

        ViewHolder(ItemDownloadBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(DownloadEntity entity) {
            binding.tvTitle.setText(entity.title);

            int progress = entity.totalBytes > 0
                    ? (int) (entity.downloadedBytes * 100 / entity.totalBytes) : 0;
            binding.progressBar.setProgress(progress);

            String status;
            switch (entity.status != null ? entity.status : "") {
                case "downloading":
                    status = progress + "%";
                    binding.btnAction.setImageResource(R.drawable.ic_pause_circle);
                    break;
                case "paused":
                    status = "Paused · " + progress + "%";
                    binding.btnAction.setImageResource(R.drawable.ic_resume);
                    break;
                case "done":
                    status = "Complete";
                    binding.progressBar.setProgress(100);
                    binding.btnAction.setImageResource(R.drawable.ic_play);
                    break;
                case "failed":
                    status = "Failed";
                    binding.btnAction.setImageResource(R.drawable.ic_resume);
                    break;
                default:
                    status = "Pending";
                    binding.btnAction.setImageResource(R.drawable.ic_pause_circle);
                    break;
            }
            binding.tvStatus.setText(status);

            String thumbUrl = entity.thumbnailUrl;
            if (thumbUrl != null && !thumbUrl.startsWith("http")) {
                thumbUrl = serverUrl + thumbUrl;
            }
            Glide.with(binding.ivThumbnail.getContext())
                    .load(thumbUrl)
                    .placeholder(R.drawable.bg_card_surface)
                    .centerCrop()
                    .into(binding.ivThumbnail);

            binding.btnAction.setOnClickListener(v -> {
                if (listener != null) listener.onPauseResume(entity);
            });
            binding.btnDelete.setOnClickListener(v -> {
                if (listener != null) listener.onDelete(entity);
            });
            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) listener.onItemClick(entity);
            });
        }
    }

    private static final DiffUtil.ItemCallback<DownloadEntity> DIFF_CALLBACK =
            new DiffUtil.ItemCallback<DownloadEntity>() {
                @Override
                public boolean areItemsTheSame(@NonNull DownloadEntity o, @NonNull DownloadEntity n) {
                    return o.mediaId.equals(n.mediaId);
                }

                @Override
                public boolean areContentsTheSame(@NonNull DownloadEntity o, @NonNull DownloadEntity n) {
                    return o.mediaId.equals(n.mediaId)
                            && o.downloadedBytes == n.downloadedBytes
                            && (o.status != null && o.status.equals(n.status));
                }
            };
}

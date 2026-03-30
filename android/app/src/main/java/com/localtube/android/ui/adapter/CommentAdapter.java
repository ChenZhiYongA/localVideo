package com.localtube.android.ui.adapter;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.localtube.android.data.local.entity.DanmakuEntity;
import com.localtube.android.databinding.ItemCommentBinding;

public class CommentAdapter extends ListAdapter<DanmakuEntity, CommentAdapter.ViewHolder> {

    public CommentAdapter() {
        super(DIFF_CALLBACK);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCommentBinding binding = ItemCommentBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemCommentBinding binding;

        ViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(DanmakuEntity item) {
            binding.tvSender.setText(item.senderName != null ? item.senderName : "Anonymous");
            binding.tvComment.setText(item.text);
            long totalSeconds = item.timeMs / 1000;
            long min = totalSeconds / 60;
            long sec = totalSeconds % 60;
            binding.tvTime.setText(String.format("%d:%02d", min, sec));
        }
    }

    private static final DiffUtil.ItemCallback<DanmakuEntity> DIFF_CALLBACK =
            new DiffUtil.ItemCallback<DanmakuEntity>() {
                @Override
                public boolean areItemsTheSame(@NonNull DanmakuEntity o, @NonNull DanmakuEntity n) {
                    return o.id == n.id;
                }

                @Override
                public boolean areContentsTheSame(@NonNull DanmakuEntity o, @NonNull DanmakuEntity n) {
                    return o.id == n.id && o.text.equals(n.text);
                }
            };
}

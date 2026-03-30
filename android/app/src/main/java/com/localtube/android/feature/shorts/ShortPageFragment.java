package com.localtube.android.feature.shorts;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.exoplayer.ExoPlayer;

import com.localtube.android.databinding.FragmentShortPageBinding;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ShortPageFragment extends Fragment {

    private static final String ARG_MEDIA_ID = "media_id";
    private static final String ARG_TITLE = "title";
    private static final String ARG_PATH = "path";

    private FragmentShortPageBinding binding;
    private ExoPlayer player;

    @Inject
    SharedPreferences prefs;

    public static ShortPageFragment newInstance(String mediaId, String title, String path) {
        ShortPageFragment fragment = new ShortPageFragment();
        Bundle args = new Bundle();
        args.putString(ARG_MEDIA_ID, mediaId);
        args.putString(ARG_TITLE, title);
        args.putString(ARG_PATH, path);
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentShortPageBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        String mediaId = getArguments() != null ? getArguments().getString(ARG_MEDIA_ID) : null;
        String title = getArguments() != null ? getArguments().getString(ARG_TITLE) : "";
        String path = getArguments() != null ? getArguments().getString(ARG_PATH) : "";

        binding.tvTitle.setText(title);
        binding.tvPath.setText(path);

        if (mediaId != null) {
            setupPlayer(mediaId);
        }
    }

    private void setupPlayer(String mediaId) {
        String serverUrl = prefs.getString("server_url", "http://192.168.1.100:8000");
        String streamUrl = serverUrl + "/api/stream/direct/" + mediaId;

        player = new ExoPlayer.Builder(requireContext()).build();
        binding.playerView.setPlayer(player);

        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(streamUrl)
                .setMimeType(MimeTypes.VIDEO_MP4)
                .build();

        player.setMediaItem(mediaItem);
        player.setRepeatMode(ExoPlayer.REPEAT_MODE_ONE);
        player.prepare();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (player != null) {
            player.setPlayWhenReady(true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (player != null) {
            player.setPlayWhenReady(false);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (player != null) {
            player.release();
            player = null;
        }
        binding = null;
    }
}

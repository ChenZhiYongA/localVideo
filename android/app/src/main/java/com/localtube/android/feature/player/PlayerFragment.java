package com.localtube.android.feature.player;

import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import android.view.GestureDetector;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.SeekBar;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.lifecycle.ViewModelProvider;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.localtube.android.MainActivity;
import com.localtube.android.R;
import com.localtube.android.data.local.entity.DanmakuEntity;
import com.localtube.android.databinding.FragmentPlayerBinding;
import com.localtube.android.databinding.ViewPlayerControlsBinding;
import com.localtube.android.ui.adapter.CommentAdapter;
import com.localtube.android.ui.common.BaseFragment;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class PlayerFragment extends BaseFragment {

    private FragmentPlayerBinding binding;
    private ViewPlayerControlsBinding controlsBinding;
    private PlayerViewModel viewModel;
    private DanmakuManager danmakuManager;
    private CommentAdapter commentAdapter;
    private GestureDetector gestureDetector;
    private final Handler controlsHandler = new Handler(Looper.getMainLooper());
    private final Handler progressUpdateHandler = new Handler(Looper.getMainLooper());
    private boolean isControlsVisible = true;
    private boolean isUserSeeking = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentPlayerBinding.inflate(inflater, container, false);
        controlsBinding = binding.playerControls;
        return binding.getRoot();
    }

    @Override
    protected void setupViews(@NonNull View view) {
        viewModel = new ViewModelProvider(this).get(PlayerViewModel.class);
        viewModel.initPlayer(requireContext());

        binding.playerView.setPlayer(viewModel.getPlayer());

        commentAdapter = new CommentAdapter();
        binding.rvComments.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvComments.setAdapter(commentAdapter);
        binding.rvComments.setNestedScrollingEnabled(false);

        setupControls();
        setupGestures();
        setupDanmakuInput();

        String mediaId = getArguments() != null ? getArguments().getString("mediaId") : null;
        if (mediaId != null) {
            viewModel.loadMedia(mediaId);
            loadDanmaku(mediaId);
            loadComments(mediaId);
        }
    }

    private void setupControls() {
        controlsBinding.btnBack.setOnClickListener(v ->
                Navigation.findNavController(requireView()).navigateUp());

        controlsBinding.btnPlayPause.setOnClickListener(v -> {
            ExoPlayer player = viewModel.getPlayer();
            if (player != null) {
                if (player.isPlaying()) {
                    player.pause();
                    controlsBinding.btnPlayPause.setImageResource(R.drawable.ic_play);
                    if (danmakuManager != null) danmakuManager.pause();
                } else {
                    player.play();
                    controlsBinding.btnPlayPause.setImageResource(R.drawable.ic_pause);
                    if (danmakuManager != null) danmakuManager.resume();
                    scheduleControlsHide();
                }
            }
        });

        controlsBinding.btnRewind.setOnClickListener(v -> seekBy(-10000));
        controlsBinding.btnForward.setOnClickListener(v -> seekBy(10000));

        controlsBinding.btnFullscreen.setOnClickListener(v -> {
            if (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
                requireActivity().setRequestedOrientation(
                        android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
            } else {
                requireActivity().setRequestedOrientation(
                        android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            }
        });

        controlsBinding.btnPip.setOnClickListener(v -> enterPip());

        controlsBinding.seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && viewModel.getPlayer() != null) {
                    long duration = viewModel.getPlayer().getDuration();
                    long position = (long) ((progress / 1000f) * duration);
                    controlsBinding.tvCurrentTime.setText(formatTime(position));
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                isUserSeeking = true;
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                isUserSeeking = false;
                ExoPlayer player = viewModel.getPlayer();
                if (player != null) {
                    long duration = player.getDuration();
                    long position = (long) ((seekBar.getProgress() / 1000f) * duration);
                    player.seekTo(position);
                    if (danmakuManager != null) danmakuManager.seekTo(position);
                }
            }
        });

        binding.btnFavorite.setOnClickListener(v -> viewModel.toggleFavorite());
        controlsBinding.btnDanmakuToggle.setOnClickListener(v -> toggleDanmaku());

        startProgressUpdates();
    }

    private void setupGestures() {
        gestureDetector = new GestureDetector(requireContext(),
                new GestureDetector.SimpleOnGestureListener() {
                    @Override
                    public boolean onSingleTapConfirmed(MotionEvent e) {
                        toggleControls();
                        return true;
                    }

                    @Override
                    public boolean onDoubleTap(MotionEvent e) {
                        float x = e.getX();
                        float width = binding.playerView.getWidth();
                        if (x < width / 3f) {
                            seekBy(-10000);
                        } else if (x > width * 2f / 3f) {
                            seekBy(10000);
                        } else {
                            ExoPlayer player = viewModel.getPlayer();
                            if (player != null) {
                                if (player.isPlaying()) player.pause();
                                else player.play();
                            }
                        }
                        return true;
                    }
                });

        binding.playerView.setOnTouchListener((v, event) -> {
            gestureDetector.onTouchEvent(event);
            return true;
        });
    }

    private void setupDanmakuInput() {
        binding.etDanmaku.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                sendDanmaku();
                return true;
            }
            return false;
        });
        binding.btnSendDanmaku.setOnClickListener(v -> sendDanmaku());
    }

    private void sendDanmaku() {
        String text = binding.etDanmaku.getText() != null ?
                binding.etDanmaku.getText().toString().trim() : "";
        if (text.isEmpty()) return;

        ExoPlayer player = viewModel.getPlayer();
        long timeMs = player != null ? player.getCurrentPosition() : 0;

        if (danmakuManager != null) {
            danmakuManager.send(text, Color.WHITE, timeMs);
        }
        viewModel.saveDanmaku(text, Color.WHITE, timeMs);

        binding.etDanmaku.setText("");
    }

    private void loadDanmaku(String mediaId) {
        viewModel.getExecutors().diskIO().execute(() -> {
            List<DanmakuEntity> entities = viewModel.getDanmakuRepository()
                    .getDanmakuForMedia(mediaId);
            viewModel.getExecutors().mainThread().execute(() -> {
                if (danmakuManager != null) {
                    for (DanmakuEntity e : entities) {
                        danmakuManager.send(e.text, e.color, e.timeMs);
                    }
                }
            });
        });
    }

    private void loadComments(String mediaId) {
        viewModel.getExecutors().diskIO().execute(() -> {
            List<DanmakuEntity> entities = viewModel.getDanmakuRepository()
                    .getDanmakuForMedia(mediaId);
            viewModel.getExecutors().mainThread().execute(() ->
                    commentAdapter.submitList(entities));
        });
    }

    @Override
    protected void observeData() {
        viewModel.getCurrentMedia().observe(getViewLifecycleOwner(), media -> {
            if (media != null) {
                binding.tvTitle.setText(media.getTitle());
                binding.tvInfo.setText(String.format("%s · %s",
                        media.getFormattedDuration(), media.getFormattedSize()));
                controlsBinding.tvControlTitle.setText(media.getTitle());
            }
        });

        viewModel.getPlayerState().observe(getViewLifecycleOwner(), state -> {
            switch (state) {
                case READY:
                    controlsBinding.btnPlayPause.setImageResource(R.drawable.ic_pause);
                    scheduleControlsHide();
                    break;
                case BUFFERING:
                case LOADING:
                    break;
                case ENDED:
                    controlsBinding.btnPlayPause.setImageResource(R.drawable.ic_play);
                    showControls();
                    break;
                case ERROR:
                    showControls();
                    break;
            }
        });

        viewModel.getIsFavorite().observe(getViewLifecycleOwner(), fav -> {
            binding.btnFavorite.setImageResource(
                    fav ? R.drawable.ic_favorite : R.drawable.ic_favorite_border);
        });

        viewModel.getErrorMessage().observe(getViewLifecycleOwner(), msg -> {
            if (msg != null) showError(msg);
        });
    }

    private void startProgressUpdates() {
        Runnable updater = new Runnable() {
            @Override
            public void run() {
                ExoPlayer player = viewModel.getPlayer();
                if (player != null && !isUserSeeking) {
                    long pos = player.getCurrentPosition();
                    long dur = player.getDuration();
                    if (dur > 0) {
                        controlsBinding.seekBar.setMax(1000);
                        controlsBinding.seekBar.setProgress((int) (pos * 1000 / dur));
                        controlsBinding.tvCurrentTime.setText(formatTime(pos));
                        controlsBinding.tvDuration.setText(formatTime(dur));
                    }
                    int buffered = player.getBufferedPercentage();
                    controlsBinding.seekBar.setSecondaryProgress(buffered * 10);
                }
                progressUpdateHandler.postDelayed(this, 500);
            }
        };
        progressUpdateHandler.post(updater);
    }

    private void seekBy(long ms) {
        ExoPlayer player = viewModel.getPlayer();
        if (player != null) {
            long newPos = Math.max(0, Math.min(player.getDuration(),
                    player.getCurrentPosition() + ms));
            player.seekTo(newPos);
            if (danmakuManager != null) danmakuManager.seekTo(newPos);
        }
    }

    private void toggleControls() {
        if (isControlsVisible) hideControls();
        else showControls();
    }

    private void showControls() {
        isControlsVisible = true;
        controlsBinding.getRoot().setVisibility(View.VISIBLE);
        controlsBinding.getRoot().animate().alpha(1f).setDuration(200);
        scheduleControlsHide();
    }

    private void hideControls() {
        isControlsVisible = false;
        controlsBinding.getRoot().animate().alpha(0f).setDuration(200)
                .withEndAction(() -> controlsBinding.getRoot().setVisibility(View.GONE));
    }

    private void scheduleControlsHide() {
        controlsHandler.removeCallbacksAndMessages(null);
        controlsHandler.postDelayed(() -> {
            ExoPlayer player = viewModel.getPlayer();
            if (player != null && player.isPlaying()) {
                hideControls();
            }
        }, 3000);
    }

    private void toggleDanmaku() {
        if (binding.danmakuContainer.getVisibility() == View.VISIBLE) {
            binding.danmakuContainer.setVisibility(View.GONE);
        } else {
            binding.danmakuContainer.setVisibility(View.VISIBLE);
        }
    }

    private void enterPip() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams params = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(16, 9))
                    .build();
            requireActivity().enterPictureInPictureMode(params);
        }
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }

    private void enterFullscreen() {
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).hideBottomNav();
        }
        binding.infoScrollView.setVisibility(View.GONE);

        ViewGroup.LayoutParams params = binding.playerContainer.getLayoutParams();
        if (params instanceof androidx.constraintlayout.widget.ConstraintLayout.LayoutParams) {
            ((androidx.constraintlayout.widget.ConstraintLayout.LayoutParams) params)
                    .dimensionRatio = null;
            params.height = ViewGroup.LayoutParams.MATCH_PARENT;
            binding.playerContainer.setLayoutParams(params);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                requireActivity().getWindow(), requireActivity().getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    private void exitFullscreen() {
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).showBottomNav();
        }
        binding.infoScrollView.setVisibility(View.VISIBLE);

        ViewGroup.LayoutParams params = binding.playerContainer.getLayoutParams();
        if (params instanceof androidx.constraintlayout.widget.ConstraintLayout.LayoutParams) {
            ((androidx.constraintlayout.widget.ConstraintLayout.LayoutParams) params)
                    .dimensionRatio = "16:9";
            params.height = 0;
            binding.playerContainer.setLayoutParams(params);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                requireActivity().getWindow(), requireActivity().getWindow().getDecorView());
        controller.show(WindowInsetsCompat.Type.systemBars());
    }

    private String formatTime(long ms) {
        long total = ms / 1000;
        long h = total / 3600;
        long m = (total % 3600) / 60;
        long s = total % 60;
        if (h > 0) return String.format("%d:%02d:%02d", h, m, s);
        return String.format("%d:%02d", m, s);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        controlsHandler.removeCallbacksAndMessages(null);
        progressUpdateHandler.removeCallbacksAndMessages(null);
        if (danmakuManager != null) {
            danmakuManager.release();
        }
        binding = null;
        controlsBinding = null;
    }
}

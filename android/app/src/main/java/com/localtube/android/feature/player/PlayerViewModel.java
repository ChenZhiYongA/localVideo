package com.localtube.android.feature.player;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.okhttp.OkHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;

import com.localtube.android.data.remote.dto.FavoriteResponseDto;
import com.localtube.android.data.repository.DanmakuRepository;
import com.localtube.android.data.repository.MediaRepository;
import com.localtube.android.domain.model.MediaItem;
import com.localtube.android.ui.common.AppExecutors;
import com.localtube.android.ui.common.BaseViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;
import okhttp3.OkHttpClient;

@HiltViewModel
public class PlayerViewModel extends BaseViewModel {

    private final MediaRepository mediaRepository;
    private final DanmakuRepository danmakuRepository;
    private final AppExecutors executors;
    private final OkHttpClient okHttpClient;

    private ExoPlayer player;
    private final MutableLiveData<MediaItem> currentMedia = new MutableLiveData<>();
    private final MutableLiveData<PlayerState> playerState = new MutableLiveData<>(PlayerState.IDLE);
    private final MutableLiveData<Boolean> isFavorite = new MutableLiveData<>(false);

    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressSaveRunnable;
    private String currentMediaId;
    private long lastSavedPosition = 0;

    public enum PlayerState { IDLE, LOADING, BUFFERING, READY, ERROR, ENDED }

    @Inject
    public PlayerViewModel(MediaRepository mediaRepository,
                           DanmakuRepository danmakuRepository,
                           AppExecutors executors,
                           OkHttpClient okHttpClient) {
        this.mediaRepository = mediaRepository;
        this.danmakuRepository = danmakuRepository;
        this.executors = executors;
        this.okHttpClient = okHttpClient;
    }

    public void initPlayer(Context context) {
        if (player != null) return;

        OkHttpDataSource.Factory dataSourceFactory = new OkHttpDataSource.Factory(okHttpClient);

        player = new ExoPlayer.Builder(context)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(dataSourceFactory))
                .setLoadControl(new DefaultLoadControl.Builder()
                        .setBufferDurationsMs(15000, 60000, 2500, 5000)
                        .build())
                .setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(C.USAGE_MEDIA)
                                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                                .build(), true)
                .setHandleAudioBecomingNoisy(true)
                .build();

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int state) {
                switch (state) {
                    case Player.STATE_BUFFERING:
                        playerState.setValue(PlayerState.BUFFERING);
                        break;
                    case Player.STATE_READY:
                        playerState.setValue(PlayerState.READY);
                        break;
                    case Player.STATE_ENDED:
                        playerState.setValue(PlayerState.ENDED);
                        onVideoEnded();
                        break;
                    case Player.STATE_IDLE:
                        playerState.setValue(PlayerState.IDLE);
                        break;
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                playerState.setValue(PlayerState.ERROR);
                postError(error.getMessage());
            }
        });
    }

    public void loadMedia(String mediaId) {
        this.currentMediaId = mediaId;
        this.lastSavedPosition = 0;
        playerState.setValue(PlayerState.LOADING);

        executors.networkIO().execute(() -> {
            try {
                MediaItem item = mediaRepository.getMediaItem(mediaId);
                String serverUrl = mediaRepository.getServerUrl();

                executors.mainThread().execute(() -> {
                    currentMedia.setValue(item);
                    isFavorite.setValue(item.isFavorite());

                    String streamUrl = item.getStreamUrl();
                    if (streamUrl == null || streamUrl.isEmpty()) {
                        playerState.setValue(PlayerState.ERROR);
                        postError("Video not available for streaming");
                        return;
                    }

                    String fullUrl = serverUrl + streamUrl;

                    String mimeType;
                    if (streamUrl.endsWith(".m3u8")) {
                        mimeType = MimeTypes.APPLICATION_M3U8;
                    } else {
                        mimeType = MimeTypes.VIDEO_MP4;
                    }

                    androidx.media3.common.MediaItem mediaItem =
                            new androidx.media3.common.MediaItem.Builder()
                                    .setUri(fullUrl)
                                    .setMimeType(mimeType)
                                    .build();

                    player.setMediaItem(mediaItem);

                    long seekPos = 0;
                    if (item.getLastPositionSeconds() != null && item.getLastPositionSeconds() > 0) {
                        long posMs = (long) (item.getLastPositionSeconds() * 1000);
                        long durMs = item.getDurationMs();
                        if (durMs > 0 && (float) posMs / durMs < 0.95f) {
                            seekPos = posMs;
                        }
                    } else {
                        long localPos = mediaRepository.getWatchPosition(mediaId);
                        long durMs = item.getDurationMs();
                        if (durMs > 0 && (float) localPos / durMs < 0.95f) {
                            seekPos = localPos;
                        }
                    }

                    if (seekPos > 0) {
                        player.seekTo(seekPos);
                    }
                    player.prepare();
                    player.setPlayWhenReady(true);
                    startProgressSaving(mediaId, item);
                });
            } catch (Exception e) {
                executors.mainThread().execute(() -> {
                    playerState.setValue(PlayerState.ERROR);
                    postError(e.getMessage());
                });
            }
        });
    }

    private void startProgressSaving(String mediaId, MediaItem item) {
        stopProgressSaving();
        progressSaveRunnable = new Runnable() {
            @Override
            public void run() {
                if (player != null && player.isPlaying()) {
                    long posMs = player.getCurrentPosition();
                    long durMs = player.getDuration();
                    double posSeconds = posMs / 1000.0;
                    double durSeconds = durMs > 0 ? durMs / 1000.0 : 0;
                    double rawDelta = Math.max(0, (posMs - lastSavedPosition) / 1000.0);
                    final double delta = Math.min(rawDelta, 10);
                    lastSavedPosition = posMs;

                    executors.networkIO().execute(() ->
                            mediaRepository.saveWatchProgressToServer(mediaId, delta, posSeconds, durSeconds));

                    String thumbUrl = item.getThumbnailUrl();
                    executors.diskIO().execute(() ->
                            mediaRepository.saveWatchProgressLocal(mediaId, item.getTitle(),
                                    thumbUrl, posMs, durMs));
                }
                progressHandler.postDelayed(this, 5000);
            }
        };
        progressHandler.postDelayed(progressSaveRunnable, 5000);
    }

    private void stopProgressSaving() {
        if (progressSaveRunnable != null) {
            progressHandler.removeCallbacks(progressSaveRunnable);
        }
    }

    private void onVideoEnded() {
        if (currentMediaId != null) {
            executors.networkIO().execute(() -> mediaRepository.recordPlay(currentMediaId));
        }
    }

    public void toggleFavorite() {
        if (currentMediaId == null) return;
        executors.networkIO().execute(() -> {
            try {
                FavoriteResponseDto response = mediaRepository.toggleFavorite(currentMediaId);
                executors.mainThread().execute(() -> isFavorite.setValue(response.isFavorite));
            } catch (Exception e) {
                postError("Failed to toggle favorite");
            }
        });
    }

    public void saveDanmaku(String text, int color, long timeMs) {
        if (currentMediaId == null) return;
        executors.diskIO().execute(() ->
                danmakuRepository.saveDanmaku(currentMediaId, text, color,
                        0, timeMs, "Me"));
    }

    public ExoPlayer getPlayer() { return player; }
    public LiveData<MediaItem> getCurrentMedia() { return currentMedia; }
    public LiveData<PlayerState> getPlayerState() { return playerState; }
    public LiveData<Boolean> getIsFavorite() { return isFavorite; }
    public String getServerUrl() { return mediaRepository.getServerUrl(); }
    public DanmakuRepository getDanmakuRepository() { return danmakuRepository; }
    public String getCurrentMediaId() { return currentMediaId; }
    public AppExecutors getExecutors() { return executors; }

    @Override
    protected void onCleared() {
        super.onCleared();
        stopProgressSaving();
        if (player != null) {
            player.release();
            player = null;
        }
    }
}

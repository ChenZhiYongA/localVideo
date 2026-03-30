package com.localtube.android.domain.model;

public class WatchHistory {
    private String mediaId;
    private String title;
    private String thumbnailUrl;
    private long durationMs;
    private long positionMs;
    private float progressPercent;
    private long lastWatchedAt;

    public String getMediaId() { return mediaId; }
    public void setMediaId(String mediaId) { this.mediaId = mediaId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public long getPositionMs() { return positionMs; }
    public void setPositionMs(long positionMs) { this.positionMs = positionMs; }

    public float getProgressPercent() { return progressPercent; }
    public void setProgressPercent(float progressPercent) { this.progressPercent = progressPercent; }

    public long getLastWatchedAt() { return lastWatchedAt; }
    public void setLastWatchedAt(long lastWatchedAt) { this.lastWatchedAt = lastWatchedAt; }
}

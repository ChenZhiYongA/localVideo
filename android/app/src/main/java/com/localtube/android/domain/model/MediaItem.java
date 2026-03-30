package com.localtube.android.domain.model;

import java.util.List;

public class MediaItem {
    private String id;
    private int folderId;
    private String fileName;
    private String nameNoExt;
    private String extension;
    private String mediaType;
    private long fileSize;
    private String fileSizeFormatted;
    private String modifiedAt;
    private String modifiedRelative;
    private String indexedAt;
    private Double durationSeconds;
    private String durationFormatted;
    private Integer width;
    private Integer height;
    private Integer imgWidth;
    private Integer imgHeight;
    private Double fps;
    private String videoCodec;
    private String audioCodec;
    private String resolutionLabel;
    private String thumbnailStatus;
    private String thumbnailUrl;
    private String transcodeStatus;
    private String streamUrl;
    private Double transcodeProgress;
    private int playCount;
    private String lastPlayed;
    private boolean favorite;
    private boolean fromTelegram;
    private int watchTimeSeconds;
    private Double lastPositionSeconds;
    private String lastWatchAt;
    private List<String> tags;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getFolderId() {
        return folderId;
    }

    public void setFolderId(int folderId) {
        this.folderId = folderId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getNameNoExt() {
        return nameNoExt;
    }

    public void setNameNoExt(String nameNoExt) {
        this.nameNoExt = nameNoExt;
    }

    public String getExtension() {
        return extension;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileSizeFormatted() {
        return fileSizeFormatted;
    }

    public void setFileSizeFormatted(String fileSizeFormatted) {
        this.fileSizeFormatted = fileSizeFormatted;
    }

    public String getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(String modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public String getModifiedRelative() {
        return modifiedRelative;
    }

    public void setModifiedRelative(String modifiedRelative) {
        this.modifiedRelative = modifiedRelative;
    }

    public String getIndexedAt() {
        return indexedAt;
    }

    public void setIndexedAt(String indexedAt) {
        this.indexedAt = indexedAt;
    }

    public Double getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Double durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getDurationFormatted() {
        return durationFormatted;
    }

    public void setDurationFormatted(String durationFormatted) {
        this.durationFormatted = durationFormatted;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getImgWidth() {
        return imgWidth;
    }

    public void setImgWidth(Integer imgWidth) {
        this.imgWidth = imgWidth;
    }

    public Integer getImgHeight() {
        return imgHeight;
    }

    public void setImgHeight(Integer imgHeight) {
        this.imgHeight = imgHeight;
    }

    public Double getFps() {
        return fps;
    }

    public void setFps(Double fps) {
        this.fps = fps;
    }

    public String getVideoCodec() {
        return videoCodec;
    }

    public void setVideoCodec(String videoCodec) {
        this.videoCodec = videoCodec;
    }

    public String getAudioCodec() {
        return audioCodec;
    }

    public void setAudioCodec(String audioCodec) {
        this.audioCodec = audioCodec;
    }

    public String getResolutionLabel() {
        return resolutionLabel;
    }

    public void setResolutionLabel(String resolutionLabel) {
        this.resolutionLabel = resolutionLabel;
    }

    public String getThumbnailStatus() {
        return thumbnailStatus;
    }

    public void setThumbnailStatus(String thumbnailStatus) {
        this.thumbnailStatus = thumbnailStatus;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getTranscodeStatus() {
        return transcodeStatus;
    }

    public void setTranscodeStatus(String transcodeStatus) {
        this.transcodeStatus = transcodeStatus;
    }

    public String getStreamUrl() {
        return streamUrl;
    }

    public void setStreamUrl(String streamUrl) {
        this.streamUrl = streamUrl;
    }

    public Double getTranscodeProgress() {
        return transcodeProgress;
    }

    public void setTranscodeProgress(Double transcodeProgress) {
        this.transcodeProgress = transcodeProgress;
    }

    public int getPlayCount() {
        return playCount;
    }

    public void setPlayCount(int playCount) {
        this.playCount = playCount;
    }

    public String getLastPlayed() {
        return lastPlayed;
    }

    public void setLastPlayed(String lastPlayed) {
        this.lastPlayed = lastPlayed;
    }

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }

    public boolean isFromTelegram() {
        return fromTelegram;
    }

    public void setFromTelegram(boolean fromTelegram) {
        this.fromTelegram = fromTelegram;
    }

    public int getWatchTimeSeconds() {
        return watchTimeSeconds;
    }

    public void setWatchTimeSeconds(int watchTimeSeconds) {
        this.watchTimeSeconds = watchTimeSeconds;
    }

    public Double getLastPositionSeconds() {
        return lastPositionSeconds;
    }

    public void setLastPositionSeconds(Double lastPositionSeconds) {
        this.lastPositionSeconds = lastPositionSeconds;
    }

    public String getLastWatchAt() {
        return lastWatchAt;
    }

    public void setLastWatchAt(String lastWatchAt) {
        this.lastWatchAt = lastWatchAt;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public long getDurationMs() {
        return durationSeconds != null ? (long) (durationSeconds * 1000) : 0;
    }

    public String getTitle() {
        return nameNoExt != null ? nameNoExt : fileName;
    }

    public String getFormattedDuration() {
        return durationFormatted != null ? durationFormatted : "";
    }

    public String getFormattedSize() {
        return fileSizeFormatted != null ? fileSizeFormatted : "";
    }

    public String getPath() {
        return streamUrl != null ? streamUrl : "";
    }
}

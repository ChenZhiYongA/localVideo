package com.localtube.android.domain.model;

public class DanmakuItem {
    private int id;
    private String mediaId;
    private long timeMs;
    private String text;
    private int color;
    private int type;
    private String senderName;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getMediaId() { return mediaId; }
    public void setMediaId(String mediaId) { this.mediaId = mediaId; }

    public long getTimeMs() { return timeMs; }
    public void setTimeMs(long timeMs) { this.timeMs = timeMs; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public int getColor() { return color; }
    public void setColor(int color) { this.color = color; }

    public int getType() { return type; }
    public void setType(int type) { this.type = type; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
}

package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

public class WatchProgressDto {
    @SerializedName("delta_seconds")
    public double deltaSeconds;

    @SerializedName("position_seconds")
    public Double positionSeconds;

    @SerializedName("duration_seconds")
    public Double durationSeconds;

    public WatchProgressDto(double deltaSeconds, Double positionSeconds, Double durationSeconds) {
        this.deltaSeconds = deltaSeconds;
        this.positionSeconds = positionSeconds;
        this.durationSeconds = durationSeconds;
    }
}

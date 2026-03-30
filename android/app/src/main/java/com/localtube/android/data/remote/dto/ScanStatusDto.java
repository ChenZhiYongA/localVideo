package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

public class ScanStatusDto {
    @SerializedName("scanning")
    public boolean scanning;

    @SerializedName("folder_id")
    public Integer folderId;
}

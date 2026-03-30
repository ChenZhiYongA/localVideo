package com.localtube.android.data.remote.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class LibraryResponseDto {
    @SerializedName("items")
    public List<MediaItemDto> items;

    @SerializedName("total")
    public int total;

    @SerializedName("page")
    public int page;

    @SerializedName("per_page")
    public int perPage;

    @SerializedName("total_pages")
    public int totalPages;
}

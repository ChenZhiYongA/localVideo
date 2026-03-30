package com.localtube.android.data.remote.api;

import com.google.gson.JsonObject;
import com.localtube.android.data.remote.dto.FavoriteResponseDto;
import com.localtube.android.data.remote.dto.FolderDto;
import com.localtube.android.data.remote.dto.LibraryResponseDto;
import com.localtube.android.data.remote.dto.MediaItemDto;
import com.localtube.android.data.remote.dto.ScanStatusDto;
import com.localtube.android.data.remote.dto.StatsDto;
import com.localtube.android.data.remote.dto.WatchProgressDto;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface LocalTubeApi {

    @GET("api/library")
    Call<LibraryResponseDto> getLibrary(
            @Query("type") String type,
            @Query("folder_id") Integer folderId,
            @Query("sort") String sort,
            @Query("order") String order,
            @Query("search") String search,
            @Query("page") int page,
            @Query("per_page") int perPage,
            @Query("favorites_only") Boolean favoritesOnly,
            @Query("source") String source
    );

    @GET("api/library/stats")
    Call<StatsDto> getStats();

    @GET("api/media/{media_id}")
    Call<MediaItemDto> getMediaItem(@Path("media_id") String mediaId);

    @POST("api/media/{media_id}/play")
    Call<MediaItemDto> recordPlay(@Path("media_id") String mediaId);

    @PATCH("api/media/{media_id}/favorite")
    Call<FavoriteResponseDto> toggleFavorite(@Path("media_id") String mediaId);

    @POST("api/media/{media_id}/watch-progress")
    Call<Map<String, Object>> saveWatchProgress(
            @Path("media_id") String mediaId,
            @Body WatchProgressDto body
    );

    @GET("api/media/{media_id}/tags")
    Call<JsonObject> getMediaTags(@Path("media_id") String mediaId);

    @PUT("api/media/{media_id}/tags")
    Call<JsonObject> putMediaTags(
            @Path("media_id") String mediaId,
            @Body Map<String, List<String>> body
    );

    @GET("api/folders")
    Call<List<FolderDto>> getFolders();

    @POST("api/folders")
    Call<FolderDto> addFolder(@Body Map<String, String> body);

    @DELETE("api/folders/{folder_id}")
    Call<Void> deleteFolder(@Path("folder_id") int folderId);

    @PATCH("api/folders/{folder_id}/toggle")
    Call<FolderDto> toggleFolder(@Path("folder_id") int folderId);

    @POST("api/scan")
    Call<Map<String, Object>> triggerScan(@Body Map<String, Object> body);

    @GET("api/scan/status")
    Call<ScanStatusDto> getScanStatus();
}

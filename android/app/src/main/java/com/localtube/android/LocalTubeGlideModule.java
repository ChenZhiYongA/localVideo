package com.localtube.android;

import android.content.Context;

import androidx.annotation.NonNull;

import com.bumptech.glide.Glide;
import com.bumptech.glide.GlideBuilder;
import com.bumptech.glide.Registry;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory;
import com.bumptech.glide.load.engine.cache.MemorySizeCalculator;
import com.bumptech.glide.module.AppGlideModule;

@GlideModule
public class LocalTubeGlideModule extends AppGlideModule {

    @Override
    public void applyOptions(@NonNull Context context, @NonNull GlideBuilder builder) {
        builder.setMemorySizeCalculator(
                new MemorySizeCalculator.Builder(context)
                        .setMemoryCacheScreens(3f)
                        .build()
        );
        builder.setDiskCache(
                new InternalCacheDiskCacheFactory(context, 512 * 1024 * 1024)
        );
    }

    @Override
    public void registerComponents(@NonNull Context context, @NonNull Glide glide,
                                   @NonNull Registry registry) {
    }

    @Override
    public boolean isManifestParsingEnabled() {
        return false;
    }
}

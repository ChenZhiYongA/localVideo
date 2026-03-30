package com.localtube.android.ui.common;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.inject.Inject;
import javax.inject.Singleton;

@Singleton
public class AppExecutors {

    private final Executor diskIO;
    private final Executor networkIO;
    private final Executor mainThread;

    @Inject
    public AppExecutors() {
        this.diskIO = Executors.newFixedThreadPool(3);
        this.networkIO = Executors.newFixedThreadPool(5);
        this.mainThread = new MainThreadExecutor();
    }

    public Executor diskIO() { return diskIO; }
    public Executor networkIO() { return networkIO; }
    public Executor mainThread() { return mainThread; }

    private static class MainThreadExecutor implements Executor {
        private final Handler mainHandler = new Handler(Looper.getMainLooper());

        @Override
        public void execute(Runnable command) {
            mainHandler.post(command);
        }
    }
}

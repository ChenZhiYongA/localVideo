package com.localtube.android.feature.player;

import android.graphics.Color;

import master.flame.danmaku.controller.DrawHandler;
import master.flame.danmaku.danmaku.model.BaseDanmaku;
import master.flame.danmaku.danmaku.model.DanmakuTimer;
import master.flame.danmaku.danmaku.model.IDanmakus;
import master.flame.danmaku.danmaku.model.IDisplayer;
import master.flame.danmaku.danmaku.model.android.DanmakuContext;
import master.flame.danmaku.danmaku.model.android.Danmakus;
import master.flame.danmaku.danmaku.parser.BaseDanmakuParser;
import master.flame.danmaku.ui.widget.DanmakuView;

public class DanmakuManager {

    private DanmakuView danmakuView;
    private DanmakuContext danmakuContext;
    private boolean isPrepared = false;

    public DanmakuManager(DanmakuView view) {
        this.danmakuView = view;
        danmakuContext = DanmakuContext.create();
        danmakuContext.setDanmakuStyle(IDisplayer.DANMAKU_STYLE_STROKEN, 3)
                .setDuplicateMergingEnabled(false)
                .setScrollSpeedFactor(1.2f)
                .setScaleTextSize(1.2f);
    }

    public void prepare() {
        BaseDanmakuParser parser = new BaseDanmakuParser() {
            @Override
            protected IDanmakus parse() {
                return new Danmakus();
            }
        };

        danmakuView.setCallback(new DrawHandler.Callback() {
            @Override
            public void prepared() {
                isPrepared = true;
                danmakuView.start();
            }

            @Override
            public void updateTimer(DanmakuTimer timer) {}

            @Override
            public void danmakuShown(BaseDanmaku danmaku) {}

            @Override
            public void drawingFinished() {}
        });

        danmakuView.prepare(parser, danmakuContext);
        danmakuView.showFPS(false);
        danmakuView.enableDanmakuDrawingCache(true);
    }

    public void send(String text, int color, long timeMs) {
        if (!isPrepared || danmakuView == null) return;
        BaseDanmaku d = danmakuContext.mDanmakuFactory
                .createDanmaku(BaseDanmaku.TYPE_SCROLL_RL);
        if (d == null) return;
        d.text = text;
        d.padding = 5;
        d.priority = 1;
        d.isLive = false;
        d.setTime(timeMs);
        d.textSize = 25f;
        d.textColor = color;
        d.textShadowColor = Color.parseColor("#80000000");
        danmakuView.addDanmaku(d);
    }

    public void seekTo(long ms) {
        if (isPrepared && danmakuView != null) {
            danmakuView.seekTo(ms);
        }
    }

    public void pause() {
        if (danmakuView != null) danmakuView.pause();
    }

    public void resume() {
        if (danmakuView != null) danmakuView.resume();
    }

    public void release() {
        if (danmakuView != null) {
            isPrepared = false;
            danmakuView.release();
            danmakuView = null;
        }
    }

    public boolean isPrepared() { return isPrepared; }
}

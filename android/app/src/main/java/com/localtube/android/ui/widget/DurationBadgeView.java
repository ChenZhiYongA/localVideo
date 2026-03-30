package com.localtube.android.ui.widget;

import android.content.Context;
import android.util.AttributeSet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatTextView;

import com.localtube.android.R;

public class DurationBadgeView extends AppCompatTextView {

    public DurationBadgeView(@NonNull Context context) {
        super(context);
        init();
    }

    public DurationBadgeView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public DurationBadgeView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        setBackgroundResource(R.drawable.bg_duration_badge);
        setTextColor(getResources().getColor(R.color.white, null));
        setTextSize(11);
    }

    public void setDurationMs(long durationMs) {
        long totalSeconds = durationMs / 1000;
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        if (hours > 0) {
            setText(String.format("%d:%02d:%02d", hours, minutes, seconds));
        } else {
            setText(String.format("%d:%02d", minutes, seconds));
        }
    }
}

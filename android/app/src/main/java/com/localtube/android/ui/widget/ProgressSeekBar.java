package com.localtube.android.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.AttributeSet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatSeekBar;
import androidx.core.content.ContextCompat;

import com.localtube.android.R;

public class ProgressSeekBar extends AppCompatSeekBar {

    private final Paint bufferPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private int bufferProgress = 0;

    public ProgressSeekBar(@NonNull Context context) {
        super(context);
        init();
    }

    public ProgressSeekBar(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ProgressSeekBar(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        bufferPaint.setColor(ContextCompat.getColor(getContext(), R.color.text_tertiary));
    }

    public void setBufferProgress(int progress) {
        this.bufferProgress = progress;
        invalidate();
    }

    @Override
    protected synchronized void onDraw(Canvas canvas) {
        if (bufferProgress > 0 && getMax() > 0) {
            float ratio = (float) bufferProgress / getMax();
            float width = getWidth() * ratio;
            float height = getHeight() / 2f;
            canvas.drawRect(0, height - 2, width, height + 2, bufferPaint);
        }
        super.onDraw(canvas);
    }
}

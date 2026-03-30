package com.localtube.android.ui.common;

import android.os.Bundle;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public abstract class BaseFragment extends Fragment {

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        setupViews(view);
        observeData();
    }

    protected abstract void setupViews(@NonNull View view);

    protected abstract void observeData();

    protected void showError(String message) {
        if (getView() != null && getContext() != null) {
            com.google.android.material.snackbar.Snackbar
                    .make(getView(), message, com.google.android.material.snackbar.Snackbar.LENGTH_SHORT)
                    .show();
        }
    }
}

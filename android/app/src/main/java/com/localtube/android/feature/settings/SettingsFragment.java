package com.localtube.android.feature.settings;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;
import com.localtube.android.BuildConfig;
import com.localtube.android.R;
import com.localtube.android.databinding.FragmentSettingsBinding;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class SettingsFragment extends androidx.fragment.app.Fragment {

    private FragmentSettingsBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentSettingsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        binding.toolbar.setNavigationOnClickListener(v ->
                Navigation.findNavController(view).navigateUp());

        if (savedInstanceState == null) {
            getChildFragmentManager().beginTransaction()
                    .replace(R.id.settingsContainer, new SettingsPreferenceFragment())
                    .commit();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    @AndroidEntryPoint
    public static class SettingsPreferenceFragment extends PreferenceFragmentCompat {

        private SettingsViewModel viewModel;

        @Override
        public void onCreatePreferences(@Nullable Bundle savedInstanceState, @Nullable String rootKey) {
            setPreferencesFromResource(R.xml.preferences, rootKey);
            viewModel = new ViewModelProvider(requireParentFragment()).get(SettingsViewModel.class);

            Preference version = findPreference("version");
            if (version != null) {
                version.setSummary(BuildConfig.VERSION_NAME);
            }

            Preference testConn = findPreference("test_connection");
            if (testConn != null) {
                testConn.setOnPreferenceClickListener(p -> {
                    Snackbar.make(requireView(), "Testing connection...",
                            Snackbar.LENGTH_SHORT).show();
                    return true;
                });
            }

            Preference clearDownloads = findPreference("clear_downloads");
            if (clearDownloads != null) {
                clearDownloads.setOnPreferenceClickListener(p -> {
                    new MaterialAlertDialogBuilder(requireContext())
                            .setTitle(R.string.clear_downloads)
                            .setMessage("This will delete all downloaded files.")
                            .setPositiveButton(R.string.delete, (d, w) -> viewModel.clearDownloads())
                            .setNegativeButton(R.string.cancel, null)
                            .show();
                    return true;
                });
            }

            Preference clearHistory = findPreference("clear_watch_history");
            if (clearHistory != null) {
                clearHistory.setOnPreferenceClickListener(p -> {
                    viewModel.clearWatchHistory();
                    Snackbar.make(requireView(), "Watch history cleared",
                            Snackbar.LENGTH_SHORT).show();
                    return true;
                });
            }
        }
    }
}

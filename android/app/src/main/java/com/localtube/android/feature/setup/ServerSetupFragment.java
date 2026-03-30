package com.localtube.android.feature.setup;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;

import com.localtube.android.R;
import com.localtube.android.databinding.FragmentSetupBinding;
import com.localtube.android.ui.common.AppExecutors;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@AndroidEntryPoint
public class ServerSetupFragment extends Fragment {

    private FragmentSetupBinding binding;

    @Inject
    SharedPreferences prefs;

    @Inject
    OkHttpClient client;

    @Inject
    AppExecutors executors;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentSetupBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        String existing = prefs.getString("server_url", "");
        if (!existing.isEmpty()) {
            binding.etServerUrl.setText(existing);
        }

        binding.btnConnect.setOnClickListener(v -> testAndConnect());
    }

    private void testAndConnect() {
        String url = binding.etServerUrl.getText() != null
                ? binding.etServerUrl.getText().toString().trim() : "";
        if (url.isEmpty()) {
            binding.tilServerUrl.setError("Please enter a URL");
            return;
        }
        if (!url.startsWith("http")) {
            url = "http://" + url;
            binding.etServerUrl.setText(url);
        }

        binding.btnConnect.setEnabled(false);
        binding.progressBar.setVisibility(View.VISIBLE);
        binding.tvStatus.setText(R.string.connecting);
        binding.tvStatus.setTextColor(getResources().getColor(R.color.text_secondary, null));

        final String serverUrl = url;
        executors.networkIO().execute(() -> {
            try {
                String testUrl = serverUrl.endsWith("/")
                        ? serverUrl + "api/library/stats"
                        : serverUrl + "/api/library/stats";
                Request request = new Request.Builder().url(testUrl).build();
                Response response = client.newCall(request).execute();
                boolean success = response.isSuccessful();
                response.close();

                executors.mainThread().execute(() -> {
                    binding.btnConnect.setEnabled(true);
                    binding.progressBar.setVisibility(View.GONE);
                    if (success) {
                        binding.tvStatus.setText(R.string.connected);
                        binding.tvStatus.setTextColor(
                                getResources().getColor(R.color.connected_green, null));

                        prefs.edit().putString("server_url", serverUrl).apply();

                        Navigation.findNavController(requireView())
                                .navigate(R.id.action_setup_to_home);
                    } else {
                        binding.tvStatus.setText(R.string.connection_failed);
                        binding.tvStatus.setTextColor(
                                getResources().getColor(R.color.error_red, null));
                    }
                });
            } catch (Exception e) {
                executors.mainThread().execute(() -> {
                    binding.btnConnect.setEnabled(true);
                    binding.progressBar.setVisibility(View.GONE);
                    binding.tvStatus.setText(e.getMessage());
                    binding.tvStatus.setTextColor(
                            getResources().getColor(R.color.error_red, null));
                });
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

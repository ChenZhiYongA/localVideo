package com.localtube.android.data.remote.websocket;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.inject.Inject;
import javax.inject.Singleton;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

@Singleton
public class ProgressWebSocket {

    private static final String TAG = "ProgressWebSocket";

    private final OkHttpClient client;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final MutableLiveData<WsMessage> liveMessage = new MutableLiveData<>();
    private final MutableLiveData<Boolean> connectionState = new MutableLiveData<>(false);

    private WebSocket webSocket;
    private String serverUrl;
    private int reconnectAttempts = 0;
    private static final int MAX_RECONNECT_DELAY_MS = 30000;
    private boolean shouldConnect = false;

    @Inject
    public ProgressWebSocket(OkHttpClient client) {
        this.client = client;
    }

    public void connect(String serverUrl) {
        this.serverUrl = serverUrl;
        this.shouldConnect = true;
        reconnectAttempts = 0;
        doConnect();
    }

    private void doConnect() {
        if (serverUrl == null || !shouldConnect) return;
        String wsUrl = serverUrl.replace("http://", "ws://")
                .replace("https://", "wss://") + "/ws/progress";
        Request request = new Request.Builder().url(wsUrl).build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                reconnectAttempts = 0;
                mainHandler.post(() -> connectionState.setValue(true));
                Log.d(TAG, "WebSocket connected");
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                try {
                    JsonObject root = JsonParser.parseString(text).getAsJsonObject();
                    String type = root.has("type") && !root.get("type").isJsonNull()
                            ? root.get("type").getAsString()
                            : null;
                    if ("ping".equals(type)) {
                        return;
                    }
                    JsonObject data;
                    JsonElement dataEl = root.get("data");
                    if (dataEl != null && dataEl.isJsonObject()) {
                        data = dataEl.getAsJsonObject();
                    } else {
                        data = root.deepCopy();
                        data.remove("type");
                    }
                    WsMessage msg = new WsMessage();
                    msg.type = type;
                    msg.data = data;
                    mainHandler.post(() -> liveMessage.setValue(msg));
                } catch (Exception e) {
                    Log.w(TAG, "Failed to parse WS message", e);
                }
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                mainHandler.post(() -> connectionState.setValue(false));
                Log.w(TAG, "WebSocket failure: " + t.getMessage());
                scheduleReconnect();
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                mainHandler.post(() -> connectionState.setValue(false));
                if (shouldConnect) {
                    scheduleReconnect();
                }
            }
        });
    }

    private void scheduleReconnect() {
        if (!shouldConnect) return;
        int delay = (int) Math.min(Math.pow(2, reconnectAttempts) * 1000, MAX_RECONNECT_DELAY_MS);
        reconnectAttempts++;
        mainHandler.postDelayed(this::doConnect, delay);
    }

    public void disconnect() {
        shouldConnect = false;
        mainHandler.removeCallbacksAndMessages(null);
        if (webSocket != null) {
            webSocket.close(1000, "App closing");
        }
        mainHandler.post(() -> connectionState.setValue(false));
    }

    public LiveData<WsMessage> getMessages() {
        return liveMessage;
    }

    public LiveData<Boolean> getConnectionState() {
        return connectionState;
    }

    public static class WsMessage {
        public String type;
        public JsonObject data;
    }
}

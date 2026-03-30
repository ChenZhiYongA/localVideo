# LocalTube Android

Native Android video application that connects to the LocalTube FastAPI backend.

## Requirements

- **Java 17** (JDK 17+)
- **Android Studio Hedgehog** (2023.1.1) or newer
- **Android SDK 35** (compileSdk)
- **Minimum Android 8.0** (API 26)

## Build

```bash
cd android
./gradlew assembleDebug
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## Server Setup

1. Start the LocalTube backend on your local network
2. Launch the app — the setup screen appears on first run
3. Enter the server URL (e.g. `http://192.168.1.100:8000`)
4. Tap **Connect** — the app tests the connection and proceeds to the home screen
5. The server URL can be changed later in **Settings → Server**

## Features

- **Home** — Continue watching + recently added media
- **Library** — Browse all media with grid/list toggle, filters (video/audio), sort options
- **Shorts** — TikTok-style vertical swipe feed for short videos (≤3 min)
- **Player** — Full-featured video player with HLS/direct streaming, gesture controls, PiP
- **Danmaku** — Bullet comment system (send, view, toggle) powered by DanmakuFlameMaster
- **Downloads** — Background download queue with pause/resume via WorkManager
- **Search** — Full-text search across the media library
- **Settings** — Server config, playback preferences, download management, cache control

## Architecture

- **Language**: Pure Java 17 (no Kotlin)
- **UI**: XML layouts with ViewBinding (no Jetpack Compose)
- **Architecture**: MVVM + Repository pattern
- **DI**: Hilt
- **Navigation**: Navigation Component (Fragment-based)
- **Player**: Media3 ExoPlayer (HLS + direct)
- **Network**: Retrofit + OkHttp + Gson
- **Database**: Room
- **Threading**: ExecutorService + Handler/Looper + LiveData
- **Downloads**: WorkManager (survives process death)
- **Danmaku**: DanmakuFlameMaster

## Supported Android Versions

| Version | API | Status |
|---------|-----|--------|
| Android 8.0+ | 26+ | Supported |
| Android 10+ | 29+ | Recommended |
| Android 12+ | 31+ | Full Material You support |

## Known Limitations

- Danmaku comments are stored locally only — not synced across devices
- The server URL is stored in SharedPreferences — changing it requires app restart for Retrofit base URL update
- PiP mode requires Android 8.0+ (API 26)
- HLS streaming requires the backend to have completed transcoding for the media item
- Download resume depends on server supporting HTTP Range requests

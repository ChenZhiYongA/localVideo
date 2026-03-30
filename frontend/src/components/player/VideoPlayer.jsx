import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReportWatchProgress } from "../../api/library";
import { usePlayerStore } from "../../store/playerStore";
import { PlayerControls } from "./PlayerControls";
import { PlayerOverlay } from "./PlayerOverlay";

function progressKey(id) {
  return `progress_${id}`;
}

export function VideoPlayer({ mediaItem, onBack, onEnded, className = "" }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);
  const progressSaveRef = useRef(null);

  const storeVolume = usePlayerStore((s) => s.volume);
  const storeMuted = usePlayerStore((s) => s.muted);
  const setStoreVolume = usePlayerStore((s) => s.setVolume);
  const setStoreMuted = usePlayerStore((s) => s.setMuted);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [qualities, setQualities] = useState([]);
  const [qualityIndex, setQualityIndex] = useState(-1);

  const volume = storeVolume;
  const muted = storeMuted;
  const reportWatch = useReportWatchProgress();
  const wallLast = useRef(Date.now());
  const lsSynced = useRef(false);

  const clearHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimerRef.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const armControls = () => {
    setShowControls(true);
    scheduleHide();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !mediaItem?.id) return;

    setFatalError("");
    setLoading(true);
    setQualities([]);
    setQualityIndex(-1);

    hlsRef.current?.destroy();
    hlsRef.current = null;
    v.removeAttribute("src");
    v.load();

    const srcHls = mediaItem.stream_url && mediaItem.transcode_status === "done" ? mediaItem.stream_url : null;
    const srcDirect =
      mediaItem.stream_url && mediaItem.transcode_status === "not_needed" ? mediaItem.stream_url : null;

    const attachHls = (url) => {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          const levels = hls.levels || [];
          setQualities(levels.map((l) => ({ height: l.height })));
          hls.currentLevel = -1;
          setQualityIndex(-1);
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setFatalError("播放出错");
            setLoading(false);
          }
        });
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = url;
        v.addEventListener(
          "loadedmetadata",
          () => setLoading(false),
          { once: true }
        );
      } else {
        setFatalError("不支持 HLS 播放");
        setLoading(false);
      }
    };

    if (srcDirect) {
      v.src = srcDirect;
      v.addEventListener(
        "loadedmetadata",
        () => {
          setLoading(false);
          const saved = localStorage.getItem(progressKey(mediaItem.id));
          if (saved && v.duration) {
            const t = Number(saved);
            if (t > 5 && v.duration - t > 5) v.currentTime = t;
          }
        },
        { once: true }
      );
    } else if (srcHls) {
      attachHls(srcHls);
      const onMeta = () => {
        const saved = localStorage.getItem(progressKey(mediaItem.id));
        if (saved && v.duration) {
          const t = Number(saved);
          if (t > 5 && v.duration - t > 5) v.currentTime = t;
        }
        v.removeEventListener("loadedmetadata", onMeta);
      };
      v.addEventListener("loadedmetadata", onMeta);
    } else {
      setLoading(false);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [mediaItem?.id, mediaItem?.stream_url, mediaItem?.transcode_status]);

  useEffect(() => {
    wallLast.current = Date.now();
    lsSynced.current = false;
  }, [mediaItem?.id]);

  useEffect(() => {
    if (!mediaItem?.id || !playing) return;
    const tick = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      const now = Date.now();
      const dt = (now - wallLast.current) / 1000;
      wallLast.current = now;
      if (dt < 5) return;
      reportWatch.mutate({
        id: mediaItem.id,
        deltaSeconds: Math.min(50, dt),
        positionSeconds: v.currentTime,
        durationSeconds: v.duration || undefined,
      });
    }, 6200);
    return () => clearInterval(tick);
  }, [mediaItem?.id, playing, reportWatch]);

  useEffect(() => {
    if (!mediaItem?.id || !duration || lsSynced.current) return;
    const raw = localStorage.getItem(progressKey(mediaItem.id));
    if (!raw) return;
    const pos = Number(raw);
    if (pos <= 8) return;
    lsSynced.current = true;
    reportWatch.mutate({
      id: mediaItem.id,
      deltaSeconds: 0,
      positionSeconds: pos,
      durationSeconds: duration || undefined,
    });
  }, [mediaItem?.id, duration, reportWatch]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const saveProgressDebounced = useCallback((id, t) => {
    if (progressSaveRef.current) clearTimeout(progressSaveRef.current);
    progressSaveRef.current = window.setTimeout(() => {
      localStorage.setItem(progressKey(id), String(t));
    }, 5000);
  }, []);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !mediaItem?.id) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration || 0);
    setBuffered(v.buffered);
    saveProgressDebounced(mediaItem.id, v.currentTime);
  };

  const onPlay = () => {
    setPlaying(true);
    scheduleHide();
  };

  const onPause = () => {
    setPlaying(false);
    setShowControls(true);
    clearHide();
    const v = videoRef.current;
    if (v && mediaItem?.id) {
      const now = Date.now();
      const dt = (now - wallLast.current) / 1000;
      wallLast.current = now;
      if (dt >= 3) {
        reportWatch.mutate({
          id: mediaItem.id,
          deltaSeconds: Math.min(50, dt),
          positionSeconds: v.currentTime,
          durationSeconds: v.duration || undefined,
        });
      }
    }
  };

  const onVideoEnded = () => {
    const v = videoRef.current;
    if (v && mediaItem?.id) {
      reportWatch.mutate({
        id: mediaItem.id,
        deltaSeconds: 0,
        positionSeconds: v.duration || v.currentTime,
        durationSeconds: v.duration || undefined,
      });
    }
    localStorage.removeItem(progressKey(mediaItem.id));
    setPlaying(false);
    onEnded?.();
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || 0));
  };

  const onSkip = (delta) => seek((videoRef.current?.currentTime || 0) + delta);

  const onFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  };

  const onPiP = async () => {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* */
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setStoreMuted(false);
    setStoreVolume(volume + delta);
  };

  const onKeyDown = (e) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.code === "Space" || e.key === "k" || e.key === "K") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
      e.preventDefault();
      seek(v.currentTime - (e.key === "ArrowLeft" ? 5 : 10));
    } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
      e.preventDefault();
      seek(v.currentTime + (e.key === "ArrowRight" ? 5 : 10));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setStoreVolume(volume + 0.1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setStoreVolume(volume - 0.1);
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      setStoreMuted(!muted);
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      onFullscreen();
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      onPiP();
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const pct = Number(e.key) / 10;
      seek((v.duration || 0) * pct);
    } else if (e.key === "[") {
      e.preventDefault();
      playPrev();
    } else if (e.key === "]") {
      e.preventDefault();
      playNext();
    }
  };

  const onQuality = (idx) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = idx;
    setQualityIndex(idx);
  };

  const reload = () => {
    setFatalError("");
    window.location.reload();
  };

  const ready =
    mediaItem?.transcode_status === "done" ||
    mediaItem?.transcode_status === "not_needed";

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video w-full max-h-[min(80vh,100dvh-8rem)] bg-black sm:max-h-[80vh] ${className}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={armControls}
      onMouseLeave={scheduleHide}
      onWheel={onWheel}
      onTouchStart={armControls}
      onTouchEnd={() => scheduleHide()}
    >
      {!ready && mediaItem?.media_type === "video" && (
        <div className="flex h-full items-center justify-center text-yt-text-2">正在转码或排队中…</div>
      )}
      {ready && (
        <video
          ref={videoRef}
          className="h-full w-full"
          playsInline
          onClick={togglePlay}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onVideoEnded}
        />
      )}

      <PlayerOverlay
        title={mediaItem?.name_no_ext}
        onBack={onBack}
        visible={showControls || !playing}
        loading={loading && ready}
        error={fatalError}
        onReload={reload}
      />

      {ready && (
        <PlayerControls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          muted={muted}
          onPlayPause={togglePlay}
          onSeek={seek}
          onVolume={setStoreVolume}
          onMute={setStoreMuted}
          onSkip={onSkip}
          onFullscreen={onFullscreen}
          onPiP={onPiP}
          qualities={qualities}
          currentQualityIndex={qualityIndex}
          onQuality={onQuality}
          visible={showControls || !playing || !fullscreen}
        />
      )}
    </div>
  );
}

import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

function fmtTime(t) {
  if (!Number.isFinite(t)) return "0:00";
  const s = Math.floor(t);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  if (h > 0) return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

export function PlayerControls({
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  onPlayPause,
  onSeek,
  onVolume,
  onMute,
  onSkip,
  onFullscreen,
  onPiP,
  qualities,
  currentQualityIndex,
  onQuality,
  visible,
}) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-8 transition-opacity duration-200 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ProgressBar currentTime={currentTime} duration={duration} buffered={buffered} onSeek={onSeek} />
      <div className="mt-2 flex flex-wrap items-center gap-1 text-white">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          onClick={onPlayPause}
        >
          <span className="material-icons-round text-3xl">{playing ? "pause" : "play_arrow"}</span>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          onClick={() => onSkip(-10)}
        >
          <span className="material-icons-round">replay_10</span>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          onClick={() => onSkip(10)}
        >
          <span className="material-icons-round">forward_10</span>
        </button>
        <VolumeControl volume={volume} muted={muted} onVolume={onVolume} onMute={onMute} />
        <span className="ml-2 text-xs tabular-nums text-white/90">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {qualities?.length > 0 && (
            <select
              className="max-w-[100px] rounded bg-white/10 px-2 py-1 text-xs text-white outline-none"
              value={currentQualityIndex === -1 ? "auto" : String(currentQualityIndex)}
              onChange={(e) => {
                const v = e.target.value;
                onQuality(v === "auto" ? -1 : Number(v));
              }}
            >
              <option value="auto">自动</option>
              {qualities.map((q, i) => (
                <option key={i} value={String(i)}>
                  {q.height}p
                </option>
              ))}
            </select>
          )}
          {typeof document !== "undefined" && document.pictureInPictureEnabled && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
              onClick={onPiP}
            >
              <span className="material-icons-round text-xl">picture_in_picture</span>
            </button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            onClick={onFullscreen}
          >
            <span className="material-icons-round text-xl">fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}

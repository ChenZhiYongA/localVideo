export function VolumeControl({ volume, muted, onVolume, onMute }) {
  return (
    <div className="group relative flex items-center gap-1">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full text-yt-text hover:bg-yt-hover"
        onClick={() => onMute(!muted)}
        aria-label={muted ? "取消静音" : "静音"}
      >
        <span className="material-icons-round text-xl">
          {muted || volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
        </span>
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => onVolume(Number(e.target.value))}
        className="w-0 overflow-hidden opacity-0 transition-all group-hover:w-20 group-hover:opacity-100"
      />
    </div>
  );
}

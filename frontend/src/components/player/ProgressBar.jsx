import { useCallback, useMemo, useRef, useState } from "react";

export function ProgressBar({ currentTime, duration, buffered, onSeek, className = "" }) {
  const barRef = useRef(null);
  const [hoverPct, setHoverPct] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const bufferedRanges = useMemo(() => {
    if (!buffered || !duration) return [];
    const out = [];
    for (let i = 0; i < buffered.length; i++) {
      const start = (buffered.start(i) / duration) * 100;
      const end = (buffered.end(i) / duration) * 100;
      out.push({ start, end });
    }
    return out;
  }, [buffered, duration]);

  const fmt = (t) => {
    if (!Number.isFinite(t)) return "0:00";
    const s = Math.floor(t);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ss = s % 60;
    if (h > 0) return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    return `${m}:${String(ss).padStart(2, "0")}`;
  };

  const seekFromClientX = useCallback(
    (clientX) => {
      const el = barRef.current;
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      onSeek((x / rect.width) * duration);
    },
    [duration, onSeek]
  );

  const onMove = (e) => {
    const el = barRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const p = (x / rect.width) * 100;
    setHoverPct(p);
    setHoverTime((x / rect.width) * duration);
  };

  return (
    <div
      className={`group relative w-full cursor-pointer py-2 ${className}`}
      ref={barRef}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setHoverPct(null);
        setHoverTime(null);
      }}
      onClick={(e) => seekFromClientX(e.clientX)}
    >
      <div className="relative h-1.5 overflow-hidden rounded-full bg-yt-surface-3 transition-all group-hover:h-2">
        {bufferedRanges.map((r, i) => (
          <div
            key={i}
            className="absolute top-0 h-full bg-yt-text-3/40"
            style={{ left: `${r.start}%`, width: `${r.end - r.start}%` }}
          />
        ))}
        <div className="absolute left-0 top-0 h-full bg-yt-red" style={{ width: `${pct}%` }} />
      </div>
      {hoverPct != null && hoverTime != null && (
        <div
          className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-xs text-white"
          style={{ left: `${hoverPct}%` }}
        >
          {fmt(hoverTime)}
        </div>
      )}
    </div>
  );
}

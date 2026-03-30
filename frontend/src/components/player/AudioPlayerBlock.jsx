import { useEffect, useRef, useState } from "react";
import { useReportWatchProgress } from "../../api/library";

export function AudioPlayerBlock({ media, src }) {
  const ref = useRef(null);
  const reportWatch = useReportWatchProgress();
  const wallLast = useRef(Date.now());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    wallLast.current = Date.now();
  }, [media.id]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || el.paused) return;
      const now = Date.now();
      const dt = (now - wallLast.current) / 1000;
      wallLast.current = now;
      if (dt < 5) return;
      reportWatch.mutate({
        id: media.id,
        deltaSeconds: Math.min(50, dt),
        positionSeconds: el.currentTime,
        durationSeconds: el.duration || media.duration_seconds || undefined,
      });
    }, 6200);
    return () => clearInterval(t);
  }, [media.id, playing, reportWatch, media.duration_seconds]);

  const onPause = () => {
    setPlaying(false);
    const el = ref.current;
    if (!el) return;
    const now = Date.now();
    const dt = (now - wallLast.current) / 1000;
    wallLast.current = now;
    if (dt >= 3) {
      reportWatch.mutate({
        id: media.id,
        deltaSeconds: Math.min(50, dt),
        positionSeconds: el.currentTime,
        durationSeconds: el.duration || media.duration_seconds || undefined,
      });
    }
  };

  return (
    <audio
      ref={ref}
      controls
      className="w-full"
      src={src}
      preload="metadata"
      onPlay={() => setPlaying(true)}
      onPause={onPause}
      onEnded={() => {
        const el = ref.current;
        if (el) {
          reportWatch.mutate({
            id: media.id,
            deltaSeconds: 0,
            positionSeconds: el.duration || el.currentTime,
            durationSeconds: el.duration || media.duration_seconds || undefined,
          });
        }
      }}
    />
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useScanStore } from "../../store/scanStore";
import { Badge } from "../ui/Badge";
import { ProgressRing } from "../ui/ProgressRing";

function formatDuration(sec) {
  if (sec == null) return "";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  if (h > 0) return `${h}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

export function MediaCard({ media, onClick, viewMode = "grid", search = "" }) {
  const tc = useScanStore((s) => s.transcodeById[media.id]);
  const thumbSrc = media.thumbnail_url || `/api/thumbnail/${media.id}`;
  const [thumbOk, setThumbOk] = useState(true);

  useEffect(() => {
    setThumbOk(true);
  }, [media.id]);

  const titleParts = () => {
    if (!search) return media.name_no_ext;
    const q = search.toLowerCase();
    const t = media.name_no_ext;
    const i = t.toLowerCase().indexOf(q);
    if (i < 0) return t;
    return (
      <>
        {t.slice(0, i)}
        <mark className="bg-yellow-500/30 text-inherit">{t.slice(i, i + search.length)}</mark>
        {t.slice(i + search.length)}
      </>
    );
  };

  const transcodeBadge = () => {
    const st = media.transcode_status;
    if (st === "done" || st === "not_needed") return null;
    if (st === "failed") return <Badge variant="danger">失败</Badge>;
    if (st === "processing") {
      const p = tc?.percent ?? media.transcode_progress ?? 0;
      return (
        <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
          <ProgressRing percent={p} size={28} />
          处理中 {Math.round(p)}%
        </span>
      );
    }
    return <Badge variant="muted">排队</Badge>;
  };

  const showImg = media.thumbnail_status === "done" || thumbOk;

  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-lg border border-yt-border p-2 text-left transition-colors hover:bg-yt-hover"
      >
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-yt-surface-2">
          {media.from_telegram && (
            <span className="absolute right-1 top-1 z-10 rounded bg-[#1677FF]/90 px-1 py-0.5 text-[10px] font-medium text-white">
              TG
            </span>
          )}
          {showImg ? (
            <img src={thumbSrc} alt="" className="h-full w-full object-cover" onError={() => setThumbOk(false)} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="material-icons-round text-yt-text-3">
                {media.media_type === "video" ? "movie" : media.media_type === "audio" ? "audiotrack" : "image"}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-medium text-yt-text">{titleParts()}</p>
          <p className="mt-1 text-xs text-yt-text-2">
            {media.file_size_formatted}
            {media.modified_relative ? ` · ${media.modified_relative}` : ""}
          </p>
          {!!media.tags?.length && (
            <p className="mt-1 line-clamp-1 text-xs text-yt-text-2">
              {media.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
            </p>
          )}
          {transcodeBadge()}
        </div>
        {(media.media_type === "video" || media.media_type === "audio") && media.duration_formatted && (
          <span className="shrink-0 text-xs text-yt-text-2">{media.duration_formatted}</span>
        )}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      className="group w-full text-left"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-yt-surface-2">
        {showImg ? (
          <img
            src={thumbSrc}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setThumbOk(false)}
          />
        ) : (
          <div className="skeleton h-full w-full" />
        )}
        <div className="absolute left-2 top-2">
          <span className="material-icons-round rounded bg-black/60 p-1 text-lg text-white">
            {media.media_type === "video" ? "movie" : media.media_type === "audio" ? "audiotrack" : "image"}
          </span>
        </div>
        {media.from_telegram && (
          <span className="absolute right-2 top-2 rounded bg-[#1677FF]/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
            TG
          </span>
        )}
        {(media.media_type === "video" || media.media_type === "audio") && media.duration_formatted && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(media.duration_seconds)}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="material-icons-round text-5xl text-white">play_circle</span>
        </div>
        <div className="absolute bottom-2 left-2">{transcodeBadge()}</div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-yt-text">{titleParts()}</p>
      <p className="mt-1 text-xs text-yt-text-2">
        {media.file_size_formatted}
        {media.modified_relative ? ` · ${media.modified_relative}` : ""}
      </p>
      {!!media.tags?.length && (
        <p className="mt-1 line-clamp-1 text-xs text-yt-text-2">
          {media.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
        </p>
      )}
    </motion.button>
  );
}

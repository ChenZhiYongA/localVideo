import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function HeroBanner({ items }) {
  const navigate = useNavigate();
  const videos = useMemo(() => items.filter((m) => m.media_type === "video" && m.thumbnail_url), [items]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (videos.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % videos.length), 8000);
    return () => clearInterval(t);
  }, [videos.length]);

  if (!videos.length) return null;
  const current = videos[idx % videos.length];
  if (!current) return null;

  return (
    <div className="relative -mx-3 -mt-3 mb-6 overflow-hidden sm:-mx-4 sm:-mt-4 md:-mx-6 md:-mt-6">
      <div className="relative aspect-[21/9] max-h-[420px] w-full sm:aspect-[2.8/1]">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id}
            src={current.thumbnail_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-yt-bg via-yt-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-yt-bg/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="line-clamp-2 max-w-xl text-xl font-bold text-white sm:text-2xl md:text-3xl">
                {current.name_no_ext}
              </h2>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-white/70">
                {current.duration_formatted && <span>{current.duration_formatted}</span>}
                {current.resolution_label && <span>· {current.resolution_label}</span>}
                {current.from_telegram && (
                  <span className="rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    TG
                  </span>
                )}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
                  onClick={() => navigate(`/player/${current.id}`)}
                >
                  <span className="material-icons-round text-xl">play_arrow</span>
                  播放
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  onClick={() => navigate(`/player/${current.id}`)}
                >
                  <span className="material-icons-round text-xl">info</span>
                  详情
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {videos.length > 1 && (
            <div className="mt-4 flex gap-1.5">
              {videos.slice(0, Math.min(videos.length, 8)).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    i === idx % videos.length ? "w-8 bg-white" : "w-4 bg-white/30"
                  }`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

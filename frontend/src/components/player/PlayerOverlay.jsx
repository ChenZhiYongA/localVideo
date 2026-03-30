import { motion } from "framer-motion";

export function PlayerOverlay({ title, onBack, visible, loading, error, onReload }) {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 py-3"
        initial={false}
        animate={{ opacity: visible ? 1 : 0 }}
      >
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="pointer-events-none line-clamp-1 flex-1 text-sm font-medium text-white md:text-base">{title}</h1>
      </motion.div>

      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-sm text-white/90">正在准备播放…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center">
          <p className="text-sm text-white">{error}</p>
          <button type="button" className="rounded bg-yt-red px-4 py-2 text-sm text-white" onClick={onReload}>
            重新加载
          </button>
        </div>
      )}
    </>
  );
}

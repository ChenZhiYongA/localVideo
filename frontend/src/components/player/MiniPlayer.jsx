import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../store/playerStore";

export function MiniPlayer() {
  const miniMedia = usePlayerStore((s) => s.miniMedia);
  const closeMini = usePlayerStore((s) => s.closeMini);
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {miniMedia && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-yt-border bg-yt-surface shadow-lg"
          style={{ height: "var(--mini-player-h)" }}
        >
          <div className="mx-auto flex h-full max-w-screen-xl items-center gap-3 px-3">
            <button
              type="button"
              className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-yt-surface-2"
              onClick={() => {
                closeMini();
                navigate(`/player/${miniMedia.id}`);
              }}
            >
              {miniMedia.thumbnail_url ? (
                <img src={miniMedia.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="material-icons-round text-yt-text-3">movie</span>
                </div>
              )}
            </button>

            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                closeMini();
                navigate(`/player/${miniMedia.id}`);
              }}
            >
              <p className="truncate text-sm font-medium text-yt-text">{miniMedia.name_no_ext}</p>
              <p className="truncate text-xs text-yt-text-3">
                {miniMedia.duration_formatted || ""}
              </p>
            </button>

            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-yt-text-2 hover:bg-yt-hover hover:text-yt-text"
              onClick={closeMini}
              aria-label="关闭"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

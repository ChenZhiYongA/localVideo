import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function ImageViewer({ open, src, title, onClose, onPrev, onNext }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!open) setScale(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute right-4 top-4 text-white" onClick={onClose} aria-label="关闭">
            <span className="material-icons-round text-3xl">close</span>
          </button>
          {onPrev && (
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white md:left-6"
              onClick={onPrev}
            >
              <span className="material-icons-round text-4xl">chevron_left</span>
            </button>
          )}
          {onNext && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white md:right-6"
              onClick={onNext}
            >
              <span className="material-icons-round text-4xl">chevron_right</span>
            </button>
          )}
          <div className="flex max-h-full max-w-full flex-col items-center gap-2">
            <motion.img
              src={src}
              alt={title}
              className="max-h-[80vh] max-w-full object-contain"
              style={{ transform: `scale(${scale})` }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <p className="text-sm text-white/80">{title}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-white/10 px-3 py-1 text-sm text-white"
                onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              >
                放大
              </button>
              <button
                type="button"
                className="rounded bg-white/10 px-3 py-1 text-sm text-white"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              >
                缩小
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

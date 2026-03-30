import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "../../store/toastStore";

const ICONS = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const COLORS = {
  success: "bg-green-600",
  error: "bg-red-600",
  warning: "bg-amber-600",
  info: "bg-blue-600",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${COLORS[t.type]}`}
          >
            <span className="material-icons-round text-lg">{ICONS[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              className="ml-2 shrink-0 opacity-70 hover:opacity-100"
              onClick={() => remove(t.id)}
            >
              <span className="material-icons-round text-base">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

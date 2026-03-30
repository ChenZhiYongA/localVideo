import { useEffect } from "react";

export function useKeyboard(handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      const fn = handlers[e.code] || handlers[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, handlers]);
}

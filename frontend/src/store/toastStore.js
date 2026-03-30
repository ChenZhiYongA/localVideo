import { create } from "zustand";

let _id = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ type = "info", message, duration = 3500 }) => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message) => useToastStore.getState().addToast({ type: "success", message }),
  error: (message) => useToastStore.getState().addToast({ type: "error", message, duration: 5000 }),
  info: (message) => useToastStore.getState().addToast({ type: "info", message }),
  warning: (message) => useToastStore.getState().addToast({ type: "warning", message, duration: 4000 }),
};

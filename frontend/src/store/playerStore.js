import { create } from "zustand";

export const usePlayerStore = create((set, get) => ({
  currentMedia: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 1.0,
  muted: false,

  setCurrentMedia: (media, queue = [], index = 0) =>
    set({ currentMedia: media, queue, queueIndex: index, isPlaying: true }),

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      set({ currentMedia: queue[queueIndex + 1], queueIndex: queueIndex + 1 });
    }
  },

  playPrev: () => {
    const { queue, queueIndex } = get();
    if (queueIndex > 0) {
      set({ currentMedia: queue[queueIndex - 1], queueIndex: queueIndex - 1 });
    }
  },

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setMuted: (m) => set({ muted: m }),
}));

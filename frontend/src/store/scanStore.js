import { create } from "zustand";

export const useScanStore = create((set) => ({
  scanProgress: null,
  transcodeById: {},
  scanComplete: null,

  updateScanProgress: (data) => set({ scanProgress: data }),

  updateTranscodeProgress: (data) =>
    set((s) => ({
      transcodeById: {
        ...s.transcodeById,
        [data.media_id]: { quality: data.quality, percent: data.percent, title: data.title },
      },
    })),

  clearTranscode: (mediaId) =>
    set((s) => {
      const next = { ...s.transcodeById };
      delete next[mediaId];
      return { transcodeById: next };
    }),

  setScanComplete: (data) => set({ scanComplete: data, scanProgress: null }),
}));

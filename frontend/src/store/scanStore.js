import { create } from "zustand";

export const useScanStore = create((set) => ({
  scanProgress: null,
  transcodeById: {},
  scanComplete: null,

  tgDownloads: [],
  tgDownloadActive: 0,

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

  addTgDownload: (data) =>
    set((s) => ({
      tgDownloads: [
        { filename: data.filename, size: data.size, sender: data.sender, media_type: data.media_type, status: "downloading", ts: Date.now() },
        ...s.tgDownloads.slice(0, 19),
      ],
      tgDownloadActive: s.tgDownloadActive + 1,
    })),

  completeTgDownload: (filename) =>
    set((s) => ({
      tgDownloads: s.tgDownloads.map((d) =>
        d.filename === filename && d.status === "downloading" ? { ...d, status: "done" } : d
      ),
      tgDownloadActive: Math.max(0, s.tgDownloadActive - 1),
    })),

  failTgDownload: (filename) =>
    set((s) => ({
      tgDownloads: s.tgDownloads.map((d) =>
        d.filename === filename && d.status === "downloading" ? { ...d, status: "failed" } : d
      ),
      tgDownloadActive: Math.max(0, s.tgDownloadActive - 1),
    })),
}));

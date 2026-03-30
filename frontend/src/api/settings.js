import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useFfmpegSettings() {
  return useQuery({
    queryKey: ["ffmpeg-settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings/ffmpeg");
      return data;
    },
  });
}

export function usePatchFfmpeg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.patch("/settings/ffmpeg", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ffmpeg-settings"] }),
  });
}

export function useClearHls() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/settings/clear-hls");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useClearThumbnails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/settings/clear-thumbnails");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });
}

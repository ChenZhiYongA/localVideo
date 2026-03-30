import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useTelegramConfig() {
  return useQuery({
    queryKey: ["telegram-config"],
    queryFn: async () => {
      const { data } = await api.get("/telegram/config");
      return data;
    },
  });
}

export function useTelegramLogs(params) {
  const { page = 1, per_page = 20, status, media_type } = params || {};
  return useQuery({
    queryKey: ["telegram-logs", page, per_page, status, media_type],
    queryFn: async () => {
      const { data } = await api.get("/telegram/logs", {
        params: { page, per_page, status, media_type },
      });
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useTelegramStats() {
  return useQuery({
    queryKey: ["telegram-stats"],
    queryFn: async () => {
      const { data } = await api.get("/telegram/stats");
      return data;
    },
  });
}

export function usePutTelegramConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.put("/telegram/config", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-config"] });
    },
  });
}

export function useTestTelegramConnection() {
  return useMutation({
    mutationFn: async (bot_token) => {
      const { data } = await api.post("/telegram/test-connection", { bot_token });
      return data;
    },
  });
}

export function useTestTelegramChannel() {
  return useMutation({
    mutationFn: async ({ bot_token, channel_id }) => {
      const { data } = await api.post("/telegram/test-channel", { bot_token, channel_id });
      return data;
    },
  });
}

export function useClearTelegramLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete("/telegram/logs");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-logs"] });
      qc.invalidateQueries({ queryKey: ["telegram-stats"] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useScanStatus() {
  return useQuery({
    queryKey: ["scan-status"],
    queryFn: async () => {
      const { data } = await api.get("/scan/status");
      return data;
    },
    refetchInterval: 2000,
  });
}

export function useTriggerScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folderId) => {
      const { data } = await api.post("/scan", folderId != null ? { folder_id: folderId } : {});
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan-status"] });
    },
  });
}

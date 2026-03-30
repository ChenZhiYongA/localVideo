import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useLibrary(params) {
  const {
    type = "all",
    folder_id,
    sort = "date",
    order = "desc",
    search,
    favorites_only,
    per_page = 40,
    source = "all",
  } = params || {};
  return useInfiniteQuery({
    queryKey: ["library", type, folder_id, sort, order, search, favorites_only, per_page, source],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get("/library", {
        params: {
          type,
          folder_id,
          sort,
          order,
          search: search || undefined,
          favorites_only,
          page: pageParam,
          per_page,
          source: source === "all" ? undefined : source,
        },
      });
      return data;
    },
    getNextPageParam: (last) => {
      if (last.page < last.total_pages) return last.page + 1;
      return undefined;
    },
  });
}

export function useLibraryStats() {
  return useQuery({
    queryKey: ["library-stats"],
    queryFn: async () => {
      const { data } = await api.get("/library/stats");
      return data;
    },
  });
}

export function useMediaItem(id) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      const { data } = await api.get(`/media/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRecordPlay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/media/${id}/play`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["media", id] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/media/${id}/favorite`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["media", id] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

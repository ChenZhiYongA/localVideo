import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useComments(mediaId) {
  return useQuery({
    queryKey: ["comments", mediaId],
    queryFn: async () => {
      const { data } = await api.get(`/media/${mediaId}/comments`);
      return data;
    },
    enabled: !!mediaId,
  });
}

export function useAddComment(mediaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post(`/media/${mediaId}/comments`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", mediaId] });
    },
  });
}

export function useDeleteComment(mediaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId) => {
      await api.delete(`/media/${mediaId}/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", mediaId] });
    },
  });
}

export function useReactions(mediaId) {
  return useQuery({
    queryKey: ["reactions", mediaId],
    queryFn: async () => {
      const { data } = await api.get(`/media/${mediaId}/reactions`);
      return data;
    },
    enabled: !!mediaId,
  });
}

export function useToggleReaction(mediaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emoji) => {
      const { data } = await api.post(`/media/${mediaId}/reactions`, { emoji });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactions", mediaId] });
    },
  });
}

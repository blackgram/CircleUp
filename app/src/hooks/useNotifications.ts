import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/services";
import { useAuthStore } from "@/stores/auth";

export function useNotifications(page = 1) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const { data } = await notificationsApi.list(page);
      return data.data || [];
    },
    enabled: isAuthenticated(),
  });
}

export function useUnreadNotifications() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data } = await notificationsApi.getUnread();
      return data.data || { count: 0, notifications: [] };
    },
    enabled: isAuthenticated(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

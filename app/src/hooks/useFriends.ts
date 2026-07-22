import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsApi, usersApi } from "@/lib/api/services";
import { useAuthStore } from "@/stores/auth";

export function useFriends() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await friendsApi.list();
      return data.data || [];
    },
    enabled: isAuthenticated(),
  });
}

export function useFriendRequests() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["friendRequests"],
    queryFn: async () => {
      const { data } = await friendsApi.getRequests();
      return data.data || [];
    },
    enabled: isAuthenticated(),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.accept(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.reject(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      const { data } = await usersApi.search(query);
      return data.data || [];
    },
    enabled: query.length >= 2,
  });
}

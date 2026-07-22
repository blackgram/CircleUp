import { useQuery } from "@tanstack/react-query";
import { gamesApi } from "@/lib/api/services";

export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data } = await gamesApi.list();
      return data.data || [];
    },
  });
}

export function useEnabledGames() {
  return useQuery({
    queryKey: ["games", "enabled"],
    queryFn: async () => {
      const { data } = await gamesApi.getEnabled();
      return data.data || [];
    },
  });
}

export function useGameBySlug(slug: string) {
  return useQuery({
    queryKey: ["games", slug],
    queryFn: async () => {
      const { data } = await gamesApi.getBySlug(slug);
      return data.data;
    },
    enabled: !!slug,
  });
}

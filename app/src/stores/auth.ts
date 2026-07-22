import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken,

      isAdmin: () => get().user?.role === "ADMIN",
    }),
    {
      name: "circleup-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

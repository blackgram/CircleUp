"use client";

import { create } from "zustand";

interface UIState {
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  authModalOpen: false,
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
}));

'use client';

import { create } from 'zustand';

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('nexus-token') : null,
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('nexus-token', token);
      } else {
        localStorage.removeItem('nexus-token');
      }
    }
    set({ token });
  },
}));

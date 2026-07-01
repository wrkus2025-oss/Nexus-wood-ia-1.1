'use client';

import { create } from 'zustand';

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  clear: () => void;
};

function persistToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem('nexus-token', token);
  } else {
    localStorage.removeItem('nexus-token');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('nexus-token') : null,
  setToken: (token) => {
    persistToken(token);
    set({ token });
  },
  clear: () => {
    persistToken(null);
    set({ token: null });
  },
}));

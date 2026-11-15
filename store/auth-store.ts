import { create } from 'zustand';
import { AuthenticatedUser, LoginInput } from '@doctor-tracker/shared';
import { apiClient } from '../lib/api/api-client';

interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
  fetchMe: () => Promise<AuthenticatedUser | null>;
  login: (credentials: LoginInput) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient<AuthenticatedUser>('/auth/me');
      if (typeof document !== 'undefined') {
        document.cookie = 'dt_session=1; path=/; max-age=604800; SameSite=Lax';
      }
      set({ user: res.data, isLoading: false });
      return res.data;
    } catch {
      set({ user: null, isLoading: false });
      if (typeof document !== 'undefined') {
        document.cookie = 'dt_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await apiClient<{ user: AuthenticatedUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (typeof document !== 'undefined') {
        document.cookie = 'dt_session=1; path=/; max-age=604800; SameSite=Lax';
      }
      set({ user: res.data.user, isLoading: false });
      return res.data.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network or 401 error on logout
    } finally {
      set({ user: null, isLoading: false });
      if (typeof window !== 'undefined') {
        // Clear document cookies explicitly
        document.cookie = 'dt_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';
        document.cookie = 'dt_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
      }
    }
  },
}));

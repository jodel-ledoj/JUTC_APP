import { create } from 'zustand';
import { saveTokens, clearTokens, saveUser, getUser, getAccessToken, getRefreshToken } from '../lib/storage';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hydrateAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrating: true,

  setAuth: (user, accessToken, refreshToken) => {
    saveTokens(accessToken, refreshToken);
    saveUser(user);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: () => {
    clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  hydrateAuth: async () => {
    try {
      const [user, accessToken, refreshToken] = await Promise.all([
        getUser<User>(),
        getAccessToken(),
        getRefreshToken(),
      ]);
      if (user && accessToken) {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      }
    } catch {
      // Silently fail — user will be sent to login
    } finally {
      set({ isHydrating: false });
    }
  },
}));

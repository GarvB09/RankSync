/**
 * Auth Store — Zustand
 * Manual localStorage sync (no persist middleware) for synchronous hydration.
 * Zustand's persist middleware rehydrates AFTER the first render, causing
 * PrivateRoute to always redirect to /login on fresh page loads.
 */

import { create } from 'zustand';
import api from '../utils/api';

// ── localStorage helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'playpair-auth';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveToStorage = (token, user, isAuthenticated) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user, isAuthenticated }));
  } catch {}
};

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

// ── Bootstrap synchronously from localStorage ─────────────────────────────────
const stored = loadFromStorage();
if (stored.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
}

// ── Store ─────────────────────────────────────────────────────────────────────
const useAuthStore = create((set, get) => ({
  token: stored.token || null,
  user: stored.user || null,
  isAuthenticated: !!(stored.token && stored.isAuthenticated),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    set({ token });
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      get().setToken(data.token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      saveToStorage(data.token, data.user, true);
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', userData);
      get().setToken(data.token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      saveToStorage(data.token, data.user, true);
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    get().setToken(null);
    clearStorage();
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true });
      saveToStorage(token, data.user, true);
    } catch (err) {
      // Only log out on explicit 401 (token expired/invalid).
      // Network errors and cold-start failures keep the session intact.
      if (err?.response?.status === 401) {
        get().logout();
      }
    }
  },

  updateUser: (updates) => {
    set((state) => {
      const newUser = { ...state.user, ...updates };
      saveToStorage(state.token, newUser, state.isAuthenticated);
      return { user: newUser };
    });
  },
}));

export default useAuthStore;

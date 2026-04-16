/**
 * Axios instance configured for the PlayPair API
 * Includes: auth header injection, 401 redirect, retry on network errors, 429 handling
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s client-side timeout
});

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};
    config._retryCount = config._retryCount || 0;

    const status = error.response?.status;

    // 401 — session expired, redirect to login
    if (status === 401) {
      localStorage.removeItem('playpair-auth');
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 429 — rate limited, show friendly message once
    if (status === 429) {
      const msg = error.response?.data?.message || 'You\'re going too fast — please slow down.';
      toast.error(msg, { id: 'rate-limit', duration: 4000 });
      return Promise.reject(error);
    }

    // 503 / network error — retry up to 2 times with exponential back-off
    const isNetworkError = !error.response;
    const isRetryableStatus = status === 503 || status === 502 || status === 504;
    const shouldRetry = (isNetworkError || isRetryableStatus) && config._retryCount < 2;

    if (shouldRetry) {
      config._retryCount += 1;
      const delay = config._retryCount * 1000; // 1s, then 2s
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }

    // Network error with no retries left — show a clear message
    if (isNetworkError) {
      toast.error('Could not reach the server. Check your connection.', { id: 'network-error' });
    }

    return Promise.reject(error);
  }
);

export default api;
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

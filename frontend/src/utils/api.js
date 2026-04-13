/**
 * Axios instance configured for the RankSync API
 * Production backend: https://ranksync.onrender.com
 */

import axios from 'axios';

// In production VITE_API_URL points to the Render backend.
// In development the Vite proxy handles /api → localhost:5000.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ranksync-auth');
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

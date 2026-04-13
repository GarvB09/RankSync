/**
 * useSocket — manages Socket.io connection lifecycle
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../context/authStore';

let socketInstance = null;

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Reuse existing socket if connected
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    socketInstance = socket;
    socketRef.current = socket;

    return () => {
      // Don't disconnect on component unmount — keep alive for app lifetime
    };
  }, [isAuthenticated, token]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
};

export const getSocket = () => socketInstance;

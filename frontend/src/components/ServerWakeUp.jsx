/**
 * ServerWakeUp — Branded splash shown while the Render backend cold-starts
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || '';

const WAKE_DELAY_MS = 1800;   // show screen only if backend takes longer than this
const POLL_INTERVAL_MS = 3000; // re-ping every 3s while waiting

export function useServerStatus() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'slow' | 'ready'

  useEffect(() => {
    let cancelled = false;
    let timer;
    let pollTimer;

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!cancelled && res.ok) {
          setStatus('ready');
          clearTimeout(pollTimer);
        }
      } catch {
        // Backend still asleep — keep polling
        if (!cancelled) {
          pollTimer = setTimeout(ping, POLL_INTERVAL_MS);
        }
      }
    };

    // After WAKE_DELAY_MS with no response, flip to 'slow' to show the screen
    timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        // Try a quick check first — if it resolves fast, skip the screen entirely
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET', cache: 'no-store' });
        if (!cancelled && res.ok) { setStatus('ready'); return; }
      } catch {
        // Backend is sleeping
      }
      if (!cancelled) {
        setStatus('slow');
        pollTimer = setTimeout(ping, POLL_INTERVAL_MS);
      }
    }, WAKE_DELAY_MS);

    // Kick off the very first check immediately
    ping();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(pollTimer);
    };
  }, []);

  return status;
}

const dots = [0, 1, 2];

export default function ServerWakeUp({ onReady }) {
  const [elapsed, setElapsed] = useState(0);

  // Tick up a "been waiting X seconds" counter
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const message =
    elapsed < 10  ? 'Waking up the server…'      :
    elapsed < 25  ? 'Still starting up, hang on…' :
    elapsed < 45  ? 'Almost there…'               :
                    'Taking a little longer than usual…';

  return (
    <motion.div
      key="wakeup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,107,0,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(255,107,0,0.12) 0%, transparent 55%), #0D0D0D',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
        className="flex items-center gap-3 mb-10"
      >
        <img src="/logo.png" alt="PlayPair" className="w-12 h-12 object-contain" />
        <span className="font-hero text-4xl tracking-wide text-white">
          Play<span className="text-pp-orange">Pair</span>
        </span>
      </motion.div>

      {/* Spinner ring */}
      <div className="relative w-16 h-16 mb-8">
        {/* Outer track */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        {/* Spinning arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-t-pp-orange border-r-pp-orange/50 border-b-transparent border-l-transparent"
        />
        {/* Centre controller icon */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🎮</div>
      </div>

      {/* Status text */}
      <motion.p
        key={message}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-display font-semibold tracking-wider uppercase text-white/70 mb-3"
      >
        {message}
      </motion.p>

      {/* Animated dots */}
      <div className="flex items-center gap-1.5">
        {dots.map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-pp-orange"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Subtle tip */}
      {elapsed >= 8 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 text-xs text-white/30 max-w-xs text-center"
        >
          Free servers sleep when idle. This only happens on the first visit after a quiet period.
        </motion.p>
      )}
    </motion.div>
  );
}

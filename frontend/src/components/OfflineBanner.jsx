/**
 * OfflineBanner — thin banner that appears when the browser loses network
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed top-0 inset-x-0 z-[9998] flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          No internet connection — some features may not work
        </motion.div>
      )}
    </AnimatePresence>
  );
}

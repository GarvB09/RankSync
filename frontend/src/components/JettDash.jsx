/**
 * LoginAgents — Two Valorant agents that dash onto the login screen
 * Left agent slides in from the left, Jett slides in from the right
 */

import { motion } from 'framer-motion';

// Wind particles around Jett (right side)
const PARTICLES = [
  { x: 60,  y: 140, r: 3, delay: 0,    dur: 2.4 },
  { x: 90,  y: 100, r: 5, delay: 0.15, dur: 2.8 },
  { x: 40,  y: 180, r: 4, delay: 0.1,  dur: 2.2 },
  { x: 110, y: 120, r: 3, delay: 0.25, dur: 3.0 },
  { x: 75,  y: 200, r: 6, delay: 0.05, dur: 2.6 },
];

export default function LoginAgents() {
  return (
    <>
      {/* ── LEFT AGENT ─────────────────────────────────── */}
      <motion.div
        className="absolute bottom-0 left-0 pointer-events-none select-none hidden lg:block"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        {/* Teal glow behind left agent */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 70%, rgba(77,204,232,0.15) 0%, transparent 65%)',
          }}
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <img
            src="/agent-left.png"
            alt=""
            className="h-[480px] w-auto object-contain drop-shadow-[0_0_24px_rgba(77,204,232,0.3)]"
            style={{ maxHeight: '55vh' }}
          />
        </motion.div>
      </motion.div>

      {/* ── RIGHT AGENT (Jett) ─────────────────────────── */}
      <motion.div
        className="absolute bottom-0 right-0 pointer-events-none select-none hidden lg:block"
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      >
        {/* Cyan glow behind Jett */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 70%, rgba(77,204,232,0.18) 0%, transparent 65%)',
          }}
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <img
            src="/jett.png"
            alt=""
            className="h-[500px] w-auto object-contain drop-shadow-[0_0_28px_rgba(77,204,232,0.35)]"
            style={{ maxHeight: '58vh' }}
          />
        </motion.div>

        {/* Wind particles floating off Jett */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.r * 2,
              height: p.r * 2,
              background: 'radial-gradient(circle, #88E1F2, #4DCCE8)',
              right: p.x,
              bottom: p.y,
            }}
            animate={{
              opacity: [0, 0.9, 0],
              scale: [0, 1.3, 0],
              x: [-6, -18],
              y: [0, -18],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              repeatDelay: 0.8,
              delay: p.delay + 1,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>
    </>
  );
}

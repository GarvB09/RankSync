/**
 * LandingPage — Public hero page inspired by rredating.com
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_URL } from '../utils/api';

const FEATURES = [
  {
    icon: '🎯',
    title: 'MATCH BY RANK',
    desc: 'Get paired with players in your skill bracket. Iron to Radiant — everyone finds their fit.',
  },
  {
    icon: '❤️',
    title: 'LIKE & CONNECT',
    desc: 'Browse profiles like Hinge. Like someone, get matched, start climbing together.',
  },
  {
    icon: '🎮',
    title: 'RIOT VERIFIED',
    desc: 'Link your Riot account to show your real rank and game name on your profile.',
  },
  {
    icon: '💬',
    title: 'CHAT LIVE',
    desc: 'Built-in messaging so you can coordinate strats before queueing together.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-valo-dark text-white flex flex-col">

      {/* ── Announcement bar ─────────────────────────── */}
      <div className="bg-black border-b border-valo-border text-center py-2 px-4">
        <p className="text-xs text-gray-600 tracking-widest uppercase">
          ★ Not affiliated with Riot Games · For entertainment only · 18+ only ★
        </p>
      </div>

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-valo-border">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 40 40" className="w-7 h-7 flex-shrink-0">
            <polygon points="20,2 38,20 20,38 2,20" fill="#E84040" />
            <polygon points="20,10 30,20 20,30 10,20" fill="#0B0B0B" />
          </svg>
          <span className="font-display font-bold text-lg text-white tracking-widest uppercase">PlayPair</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-display font-semibold text-gray-500 tracking-widest uppercase">
          <Link to="/find-duo" className="hover:text-white transition-colors">Browse</Link>
          <Link to="/chat" className="hover:text-white transition-colors">Inbox</Link>
          <Link to="/notifications" className="hover:text-white transition-colors">Alerts</Link>
          <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-display font-semibold text-gray-400 hover:text-white transition-colors tracking-widest uppercase"
          >
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-xs px-5 py-2">
            Join Up
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-28 overflow-hidden flex-1">
        {/* Background glows */}
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-valo-red/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-valo-teal/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-valo-red/40 bg-valo-red/10 text-valo-red text-xs font-display font-semibold tracking-widest uppercase mb-10"
        >
          ★ Not affiliated with Riot Games · For entertainment only
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="font-hero leading-[0.9] tracking-tight">
            <div className="text-[clamp(4rem,12vw,9rem)] text-white uppercase">FIND YOUR</div>
            <div className="text-[clamp(4rem,12vw,9rem)] text-valo-red uppercase">PAIR</div>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-gray-500 text-sm md:text-base mt-6 max-w-sm leading-relaxed"
        >
          a (totally not serious) duo-finding site. find your pair so you stop dropping your ep7 immortal rank in swiftplay.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center gap-4 mt-10 flex-wrap justify-center"
        >
          <Link to="/register" className="btn-primary flex items-center gap-2 px-7 py-3">
            👤 Setup Your Profile
          </Link>
          <Link
            to="/find-duo"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-valo-border text-gray-300 hover:text-white hover:border-gray-500 font-display font-semibold text-sm tracking-wider uppercase rounded transition-all"
          >
            Browse First
          </Link>
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-valo-red text-xs font-display font-semibold tracking-widest uppercase mb-3">
            // How it works
          </p>
          <h2 className="font-hero text-4xl md:text-6xl text-white uppercase">BUILT DIFFERENT</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="bg-valo-card border border-valo-border rounded-lg p-6 hover:border-valo-border/60 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-bold text-white text-sm tracking-wide mb-2">{f.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-valo-border px-6 py-8 text-center mt-auto">
        <p className="text-xs text-gray-700">
          PlayPair is not affiliated with or endorsed by Riot Games. VALORANT and all related marks are trademarks of Riot Games, Inc.
        </p>
      </footer>
    </div>
  );
}

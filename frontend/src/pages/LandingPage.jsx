/**
 * LandingPage — Public hero page
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🎯',
    title: 'MATCH BY RANK',
    desc: 'Get paired with players in your skill bracket. Iron to Radiant — everyone finds their fit.',
  },
  {
    icon: '🎮',
    title: 'CONNECT & DUO',
    desc: 'Browse profiles, send a connect request, get matched, and start climbing together.',
  },
  {
    icon: '✅',
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* ── Announcement bar ─────────────────────────── */}
      <div className="bg-pp-input-bg border-b border-pp-border text-center py-2 px-4">
        <p className="text-xs text-gray-400 tracking-widest uppercase">
          ★ Not affiliated with Riot Games · For entertainment only · 18+ only ★
        </p>
      </div>

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-pp-border bg-white">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="PlayPair" className="h-8 w-auto" />
          <span className="font-display font-bold text-lg text-gray-900 tracking-widest uppercase">PlayPair</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-display font-semibold text-gray-400 tracking-widest uppercase">
          <Link to="/find-duo" className="hover:text-pp-orange transition-colors">Browse</Link>
          <Link to="/chat" className="hover:text-pp-orange transition-colors">Inbox</Link>
          <Link to="/notifications" className="hover:text-pp-orange transition-colors">Alerts</Link>
          <Link to="/profile" className="hover:text-pp-orange transition-colors">Profile</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-display font-semibold text-gray-500 hover:text-pp-orange transition-colors tracking-widest uppercase"
          >
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-xs px-5 py-2">
            Join Up
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-28 overflow-hidden flex-1 bg-pp-bg">
        {/* Background glow */}
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-pp-orange/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pp-orange/3 rounded-full blur-[100px] pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-200 bg-pp-orange-light text-pp-orange text-xs font-display font-semibold tracking-widest uppercase mb-10"
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
            <div className="text-[clamp(4rem,12vw,9rem)] text-gray-900 uppercase">FIND YOUR</div>
            <div className="text-[clamp(4rem,12vw,9rem)] text-pp-orange uppercase">PAIR</div>
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
            className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-pp-border text-gray-500 hover:text-pp-orange hover:border-pp-orange font-display font-semibold text-sm tracking-wider uppercase rounded-xl transition-all"
          >
            Browse First
          </Link>
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section className="px-6 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-pp-orange text-xs font-display font-semibold tracking-widest uppercase mb-3">
            // How it works
          </p>
          <h2 className="font-hero text-4xl md:text-6xl text-gray-900 uppercase">BUILT DIFFERENT</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="card p-6 hover:border-pp-orange hover:shadow-md transition-all duration-200"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-bold text-gray-900 text-sm tracking-wide mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="bg-pp-orange-light border-t border-orange-200 px-6 py-16 text-center">
        <h2 className="font-hero text-3xl md:text-5xl text-gray-900 uppercase mb-4">READY TO RANK UP?</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Stop solo queuing. Find a duo who actually communicates.</p>
        <Link to="/register" className="btn-primary px-10 py-3 text-base">
          🎮 Find My Duo
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-pp-border px-6 py-8 text-center bg-white">
        <p className="text-xs text-gray-400">
          PlayPair is not affiliated with or endorsed by Riot Games. VALORANT and all related marks are trademarks of Riot Games, Inc.
        </p>
      </footer>
    </div>
  );
}

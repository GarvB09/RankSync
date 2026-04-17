/**
 * AppLayout — Main app shell with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import { useSocket } from '../../hooks/useSocket';
import { useDarkMode } from '../../hooks/useDarkMode';
import { getRankColorClass } from '../../utils/rankUtils';
import RankIcon from '../RankIcon';
import FeedbackButton from '../FeedbackButton';
import api, { API_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = 'garv.b2005@gmail.com';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '⚡', label: 'Dashboard' },
  { to: '/find-duo',      icon: '🎮', label: 'Find Duo' },
  { to: '/chat',          icon: '💬', label: 'Messages' },
  { to: '/notifications', icon: '🔔', label: 'Alerts' },
  { to: '/profile',       icon: '👤', label: 'Profile' },
];

function DarkToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
        dark ? 'bg-pp-orange' : 'bg-gray-200'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] shadow transition-transform duration-300 ${
        dark ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
      }`}>
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useDarkMode();
  const { on } = useSocket();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const cleanup = on('notification', (notif) => {
      setUnreadCount((c) => c + 1);
      toast(notif.title, { icon: '🔔' });
    });
    return cleanup;
  }, [on]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--pp-bg)' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col border-r
        backdrop-blur-xl transition-all duration-300 lg:translate-x-0
        ${dark
          ? 'bg-[#111111]/95 border-white/[0.06]'
          : 'bg-white/80 border-white/60'
        }
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--pp-border)' }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PlayPair" className="w-9 h-9 object-contain" />
            <div className="font-hero text-xl leading-none tracking-wide">
              <span style={{ color: 'var(--pp-muted)' }} className="dark:text-gray-100 text-gray-900">Play</span>
              <span className="text-pp-orange">Pair</span>
            </div>
          </div>
          <DarkToggle dark={dark} onToggle={() => setDark((d) => !d)} />
        </div>

        {/* User mini-profile */}
        {user && (
          <div
            className="flex items-center gap-3 p-3 mx-3 mt-4 rounded-2xl cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--pp-input-bg)' }}
            onClick={() => navigate('/profile')}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg overflow-hidden"
                   style={{ borderColor: 'var(--pp-border)', backgroundColor: 'var(--pp-border)' }}>
                {user.avatar
                  ? <img src={user.avatar.startsWith('/uploads') ? `${API_URL}${user.avatar}` : user.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="font-bold text-sm" style={{ color: 'var(--pp-muted)' }}>{user.username[0].toUpperCase()}</span>
                }
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 status-online border-2 border-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'inherit' }}>{user.username}</div>
              <div className={`text-xs font-mono flex items-center gap-1 ${getRankColorClass(user.rank)}`}>
                <RankIcon rank={user.rank} size="w-4 h-4" />
                {user.rank || 'Unranked'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl
                font-display font-semibold text-sm tracking-wide uppercase
                transition-all duration-150
                ${isActive
                  ? 'bg-pp-orange text-white shadow-sm'
                  : dark
                    ? 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-pp-input-bg'
                }
              `}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
              {label === 'Alerts' && unreadCount > 0 && (
                <span className="ml-auto bg-pp-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin-only: Feedback inbox */}
          {isAdmin && (
            <NavLink
              to="/admin/feedback"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl
                font-display font-semibold text-sm tracking-wide uppercase
                transition-all duration-150
                ${isActive
                  ? 'bg-pp-orange text-white shadow-sm'
                  : dark
                    ? 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-pp-input-bg'
                }
              `}
            >
              <span className="text-base">📬</span>
              <span>Feedback</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom section: Twitter link + Logout */}
        <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--pp-border)' }}>
          {/* Connect with me */}
          <a
            href="https://x.com/Garvxxxb"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-display font-semibold uppercase tracking-wide"
            style={{ color: 'var(--pp-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1DA1F2'; e.currentTarget.style.backgroundColor = 'rgba(29,161,242,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--pp-muted)'; e.currentTarget.style.backgroundColor = ''; }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Connect with me</span>
          </a>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:text-pp-orange hover:bg-pp-orange-light transition-colors text-sm font-display font-semibold uppercase tracking-wide"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className={`lg:hidden flex items-center justify-between px-4 py-3 border-b shadow-sm backdrop-blur-xl ${
          dark ? 'bg-[#111111]/95 border-white/[0.06]' : 'bg-white/80 border-white/60'
        }`}>
          <button onClick={() => setSidebarOpen(true)} className="p-1" style={{ color: 'var(--pp-muted)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            <span className="font-hero text-xl">
              <span className="text-gray-900 dark:text-gray-100">Play</span>
              <span className="text-pp-orange">Pair</span>
            </span>
          </div>
          <DarkToggle dark={dark} onToggle={() => setDark((d) => !d)} />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating feedback button — all users */}
      <FeedbackButton />
    </div>
  );
}

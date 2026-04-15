/**
 * AppLayout — Main app shell with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import { useSocket } from '../../hooks/useSocket';
import { getRankColorClass, getRankEmoji, getRankIcon } from '../../utils/rankUtils';
import api, { API_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '⚡', label: 'Dashboard' },
  { to: '/find-duo',      icon: '🎮', label: 'Find Duo' },
  { to: '/chat',          icon: '💬', label: 'Messages' },
  { to: '/notifications', icon: '🔔', label: 'Alerts' },
  { to: '/profile',       icon: '👤', label: 'Profile' },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { on } = useSocket();

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
    <div className="flex h-screen overflow-hidden bg-pp-bg">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col border-r border-white/60
        backdrop-blur-xl bg-white/80
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-pp-border">
          <img src="/logo.png" alt="PlayPair" className="w-9 h-9 object-contain" />
          <div className="font-hero text-xl leading-none tracking-wide">
            <span className="text-gray-900">Play</span>
            <span className="text-pp-orange">Pair</span>
          </div>
        </div>

        {/* User mini-profile */}
        {user && (
          <div
            className="flex items-center gap-3 p-3 mx-3 mt-4 rounded-2xl bg-pp-input-bg cursor-pointer hover:bg-pp-border transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-pp-border border-2 border-pp-border flex items-center justify-center text-lg overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar.startsWith('/uploads') ? `${API_URL}${user.avatar}` : user.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-gray-600 font-bold text-sm">{user.username[0].toUpperCase()}</span>
                }
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 status-online border-2 border-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user.username}</div>
              <div className={`text-xs font-mono flex items-center gap-1 ${getRankColorClass(user.rank)}`}>
                {getRankIcon(user.rank)
                  ? <img src={getRankIcon(user.rank)} alt="" className="w-4 h-4 object-contain" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.45))'}} />
                  : <span>{getRankEmoji(user.rank)}</span>
                }
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
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-pp-border">
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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            <span className="font-hero text-xl">
              <span className="text-gray-900">Play</span>
              <span className="text-pp-orange">Pair</span>
            </span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

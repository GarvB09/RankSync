/**
 * AppLayout — Main app shell with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import { useSocket } from '../../hooks/useSocket';
import { getRankColorClass, getRankEmoji } from '../../utils/rankUtils';
import api, { API_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: '⚡', label: 'Dashboard' },
  { to: '/find-duo',     icon: '🎯', label: 'Find Duo' },
  { to: '/chat',         icon: '💬', label: 'Messages' },
  { to: '/notifications',icon: '🔔', label: 'Alerts' },
  { to: '/profile',      icon: '👤', label: 'Profile' },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { on } = useSocket();

  // Fetch notification count
  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  // Listen for real-time notifications
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
    <div className="flex h-screen overflow-hidden bg-valo-dark">
      {/* ── Mobile overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col bg-valo-card border-r border-valo-border
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-valo-border">
          <div className="w-8 h-8 relative">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 38,20 20,38 2,20" fill="#FF4655" />
              <polygon points="20,10 30,20 20,30 10,20" fill="#0F1923" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none text-white">RANK</div>
            <div className="font-display font-bold text-lg leading-none text-valo-red">SYNC</div>
          </div>
        </div>

        {/* User mini-profile */}
        {user && (
          <div
            className="flex items-center gap-3 p-4 mx-3 mt-4 rounded-lg bg-valo-dark-2 cursor-pointer hover:bg-valo-dark-3 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-valo-dark-3 border-2 border-valo-border flex items-center justify-center text-lg overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar.startsWith('/uploads') ? `${API_URL}${user.avatar}` : user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.username[0].toUpperCase()
                }
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 status-online" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.username}</div>
              <div className={`text-xs font-mono ${getRankColorClass(user.rank)}`}>
                {getRankEmoji(user.rank)} {user.rank || 'Unranked'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg
                font-display font-semibold text-sm tracking-wide uppercase
                transition-all duration-150 relative group
                ${isActive
                  ? 'bg-valo-red/10 text-valo-red border-l-2 border-valo-red pl-[14px]'
                  : 'text-gray-400 hover:text-white hover:bg-valo-dark-3 border-l-2 border-transparent pl-[14px]'
                }
              `}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
              {label === 'Alerts' && unreadCount > 0 && (
                <span className="ml-auto bg-valo-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-valo-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:text-valo-red hover:bg-valo-red/5 transition-colors text-sm font-display font-semibold uppercase tracking-wide"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-valo-card border-b border-valo-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="font-display font-bold text-valo-red">RANKSYNC</div>
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

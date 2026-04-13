/**
 * NotificationsPage
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatLastSeen } from '../utils/rankUtils';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  duo_request: '🤝',
  request_accepted: '✅',
  request_declined: '❌',
  new_message: '💬',
  system: '🔔',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.notifications))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      await api.put(`/notifications/${notif._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n)
      );
    }
    if (notif.type === 'duo_request' || notif.type === 'request_accepted') {
      navigate('/dashboard');
    } else if (notif.type === 'new_message') {
      navigate('/chat');
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-wide flex items-center gap-2">
            🔔 NOTIFICATIONS
            {unread > 0 && (
              <span className="bg-valo-red text-white text-sm rounded-full px-2 py-0.5 font-mono">
                {unread}
              </span>
            )}
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-valo-dark-3" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-valo-dark-3 rounded w-3/4" />
                <div className="h-3 bg-valo-dark-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-gray-400">No notifications yet.</p>
          <p className="text-gray-600 text-sm mt-1">Find a duo to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleNotifClick(notif)}
              className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-valo-red/30 ${
                !notif.isRead ? 'border-l-2 border-l-valo-red' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {notif.sender?.avatar ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-valo-border">
                    <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-valo-dark-3 border border-valo-border flex items-center justify-center text-xl">
                    {TYPE_ICON[notif.type]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${notif.isRead ? 'text-gray-400' : 'text-white'}`}>
                  {notif.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{notif.message}</div>
                <div className="text-xs text-gray-600 mt-1.5">{formatLastSeen(notif.createdAt)}</div>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-valo-red flex-shrink-0 mt-1.5" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

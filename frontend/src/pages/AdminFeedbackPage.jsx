/**
 * AdminFeedbackPage — only accessible to the admin (garv.b2005@gmail.com)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = 'garv.b2005@gmail.com';

const TYPE_COLORS = {
  bug:     { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', label: '🐛 Bug' },
  feature: { bg: 'rgba(168,85,247,0.1)',  text: '#a855f7', label: '💡 Feature' },
  general: { bg: 'rgba(255,107,0,0.1)',   text: '#FF6B00', label: '💬 General' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminFeedbackPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    if (user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return; }
    api.get('/feedback')
      .then(({ data }) => setFeedbacks(data.feedbacks || []))
      .catch(() => toast.error('Failed to load feedback'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const filtered = filter === 'all' ? feedbacks : feedbacks.filter((f) => f.type === filter);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Feedback Inbox</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pp-muted)' }}>
            {feedbacks.length} submission{feedbacks.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'bug', 'feature', 'general'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="text-xs px-3 py-1.5 rounded-xl border font-semibold capitalize transition-colors"
              style={{
                borderColor: filter === t ? '#FF6B00' : 'var(--pp-border)',
                backgroundColor: filter === t ? 'rgba(255,107,0,0.1)' : 'var(--pp-input-bg)',
                color: filter === t ? '#FF6B00' : 'var(--pp-muted)',
              }}
            >
              {t === 'all' ? `All (${feedbacks.length})` : `${TYPE_COLORS[t]?.label} (${feedbacks.filter(f => f.type === t).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-pp-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--pp-muted)' }}>
          <div className="text-5xl mb-3">📭</div>
          <p>No feedback yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb, i) => {
            const tc = TYPE_COLORS[fb.type] || TYPE_COLORS.general;
            return (
              <motion.div
                key={fb._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--pp-input-bg)', border: '1px solid var(--pp-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: tc.bg, color: tc.text }}>
                        {tc.label}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--pp-muted)' }}>
                        {fb.user?.username || 'Anonymous'}
                      </span>
                      {fb.user?.email && (
                        <span className="text-xs" style={{ color: 'var(--pp-subtle)' }}>
                          ({fb.user.email})
                        </span>
                      )}
                      <span className="text-xs ml-auto" style={{ color: 'var(--pp-subtle)' }}>
                        {timeAgo(fb.createdAt)}
                      </span>
                    </div>
                    {/* Message */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(fb._id)}
                    className="text-xs px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                    style={{ color: 'var(--pp-subtle)', backgroundColor: 'var(--pp-surface)' }}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * FeedbackButton — floating button + modal for user feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'bug',     label: '🐛 Bug Report' },
  { value: 'feature', label: '💡 Feature Idea' },
  { value: 'general', label: '💬 General' },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post('/feedback', { message, type });
      toast.success('Thanks for your feedback!');
      setMessage('');
      setType('general');
      setOpen(false);
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Give feedback"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-pp-orange shadow-lg flex items-center justify-center text-white text-lg hover:scale-110 transition-transform"
        style={{ boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
      >
        💬
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 16 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className="pointer-events-auto w-full max-w-md rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: 'var(--pp-surface)',
                  border: '1px solid var(--pp-border)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--pp-border)' }}>
                  <span className="font-hero text-lg text-pp-orange tracking-wide">Send Feedback</span>
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-pp-input-bg transition-colors"
                    style={{ color: 'var(--pp-muted)' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Type selector */}
                  <div className="flex gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className="flex-1 text-xs py-2 rounded-xl border font-semibold transition-colors"
                        style={{
                          borderColor: type === t.value ? '#FF6B00' : 'var(--pp-border)',
                          backgroundColor: type === t.value ? 'rgba(255,107,0,0.1)' : 'var(--pp-input-bg)',
                          color: type === t.value ? '#FF6B00' : 'var(--pp-muted)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    rows={4}
                    maxLength={1000}
                    className="input w-full resize-none"
                    style={{ fontFamily: 'inherit' }}
                    required
                  />
                  <div className="text-right text-xs" style={{ color: 'var(--pp-subtle)' }}>
                    {message.length}/1000
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="btn-primary w-full"
                  >
                    {sending ? 'Sending…' : 'Send Feedback'}
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

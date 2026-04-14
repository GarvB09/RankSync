/**
 * SetUsernamePage — Shown after Google sign-in to let new users pick a username
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SetUsernamePage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const validate = (val) => {
    if (!val.trim()) return 'Username is required';
    if (val.trim().length < 3) return 'At least 3 characters';
    if (val.trim().length > 20) return 'Max 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(val.trim())) return 'Letters, numbers, and underscores only';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(username);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/users/username', { username: username.trim() });
      updateUser({ username: data.user.username, needsUsername: false });
      toast.success('Username set! Welcome to PlayPair 🎮');
      navigate('/profile/edit', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-pp-bg flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-pp-orange/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <img src="/logo.png" alt="PlayPair" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="font-hero text-4xl text-gray-900 uppercase">WELCOME!</h1>
          <p className="text-gray-400 text-sm mt-2">One last thing — pick your gamer tag.</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-2 tracking-wide">CHOOSE YOUR USERNAME</h2>
          <p className="text-gray-500 text-sm mb-6">This is how other players will see you. You can change it later.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  className={`input pl-7 ${error ? 'border-red-400' : ''}`}
                  placeholder="YourGamertag"
                  value={username}
                  maxLength={20}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              <p className="text-gray-400 text-xs mt-1.5">Letters, numbers, and underscores only · 3–20 characters</p>
            </div>

            <button
              type="submit"
              disabled={saving || !username.trim()}
              className="btn-primary w-full py-3 disabled:opacity-40"
            >
              {saving ? 'Setting username...' : '🎮 Let\'s Go!'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

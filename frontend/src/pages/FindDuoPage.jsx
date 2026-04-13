/**
 * FindDuoPage — Hinge-style browse with animations, pass tracking, daily connect limit, weekly superlike
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
  RANKS, REGIONS, ROLES, PLAYSTYLES,
  getRankColorClass, getRankEmoji, getRoleIcon, formatLastSeen,
} from '../utils/rankUtils';
import toast from 'react-hot-toast';

const DAILY_LIKE_LIMIT = 5;
const PASS_HIDE_MS = 48 * 60 * 60 * 1000;

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getPassedProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem('playpair-passed') || '{}');
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(stored).filter(([, t]) => now - t < PASS_HIDE_MS)
    );
    localStorage.setItem('playpair-passed', JSON.stringify(cleaned));
    return cleaned;
  } catch { return {}; }
}

function passProfile(userId) {
  const passed = getPassedProfiles();
  passed[userId] = Date.now();
  localStorage.setItem('playpair-passed', JSON.stringify(passed));
}

function getTodayLikes() {
  try {
    const stored = JSON.parse(localStorage.getItem('playpair-likes') || '{}');
    const today = new Date().toDateString();
    return stored.date === today ? (stored.count || 0) : 0;
  } catch { return 0; }
}

function incrementLike() {
  const today = new Date().toDateString();
  const count = getTodayLikes() + 1;
  localStorage.setItem('playpair-likes', JSON.stringify({ date: today, count }));
  return count;
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toDateString();
}

function getSuperlikeStatus() {
  try {
    const stored = JSON.parse(localStorage.getItem('playpair-superlike') || '{}');
    const thisWeek = getWeekStart();
    if (stored.week !== thisWeek) return { used: false, week: thisWeek };
    return stored;
  } catch { return { used: false, week: getWeekStart() }; }
}

function useSuperlikeLocal() {
  localStorage.setItem('playpair-superlike', JSON.stringify({ used: true, week: getWeekStart() }));
}

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player, onRequest, onSuperlike, index, likesLeft, superlikeUsed, onLikeUsed, onSuperlikeUsed, onPassed }) {
  const [status, setStatus] = useState(player.connectionStatus || 'none');
  const [sending, setSending] = useState(false);
  const [anim, setAnim] = useState(null);
  const [visible, setVisible] = useState(true);

  const handleConnect = async () => {
    if (likesLeft <= 0) { toast.error('No connects left today! Come back tomorrow 🎮'); return; }
    setAnim('like');
    setSending(true);
    setTimeout(async () => {
      const result = await onRequest(player._id, false);
      if (result.success) { setStatus('pending_sent'); onLikeUsed(); }
      setSending(false);
      setTimeout(() => setAnim(null), 300);
    }, 700);
  };

  const handleSuperlike = async () => {
    if (superlikeUsed) { toast.error('Superlike already used this week! Resets Monday ⭐'); return; }
    setAnim('superlike');
    setSending(true);
    setTimeout(async () => {
      const result = await onSuperlike(player._id);
      if (result.success) { setStatus('pending_sent'); onSuperlikeUsed(); }
      setSending(false);
      setTimeout(() => setAnim(null), 300);
    }, 700);
  };

  const handlePass = () => {
    setAnim('pass');
    setTimeout(() => { passProfile(player._id); onPassed(player._id); setVisible(false); }, 600);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white border border-pp-border rounded-2xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative"
    >
      {/* Anim overlay */}
      <AnimatePresence>
        {anim && (
          <motion.div
            key={anim}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl"
            style={{
              background: anim === 'like' ? 'rgba(255,107,0,0.15)'
                : anim === 'superlike' ? 'rgba(245,158,11,0.18)'
                : 'rgba(0,0,0,0.12)',
            }}
          >
            <motion.div
              initial={{ scale: 0.3 }} animate={{ scale: 1.2 }} exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              {anim === 'like' ? <span className="text-8xl">🎮</span>
                : anim === 'superlike' ? <span className="text-8xl">⭐</span>
                : <span className="text-8xl">✕</span>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo */}
      <div className="relative h-60 bg-pp-input-bg overflow-hidden flex-shrink-0">
        {player.isOnline && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent z-10" />
        )}
        {player.avatar ? (
          <img src={player.avatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[6rem] text-gray-200 leading-none select-none font-hero">
              {player.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/50 to-transparent" />

        {player.isOnline && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1 z-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-semibold">Online</span>
          </div>
        )}

        <div className="absolute bottom-3 left-4 z-10">
          <span className={`font-mono font-bold text-sm ${getRankColorClass(player.rank)}`}>
            {getRankEmoji(player.rank)} {player.rank}
          </span>
        </div>

        {(player.age || player.gender) && (
          <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
            {player.gender && (
              <span className="text-xs text-gray-700 bg-white/90 rounded-full px-2 py-0.5 shadow-sm">
                {player.gender === 'Male' ? '♂' : player.gender === 'Female' ? '♀' : '⚧'} {player.gender}
              </span>
            )}
            {player.age && (
              <span className="text-xs text-gray-700 bg-white/90 rounded-full px-2 py-0.5 shadow-sm">
                {player.age}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-gray-900 text-lg leading-tight">{player.username}</h3>
            {!player.isOnline && <span className="text-xs text-gray-400">{formatLastSeen(player.lastSeen)}</span>}
          </div>
          {player.riotId?.gameName && (
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              {player.riotId.gameName}#{player.riotId.tagLine}
              <span className="mx-1.5 text-gray-300">·</span>
              {player.region}{player.city ? `, ${player.city}` : ''}
            </div>
          )}
        </div>

        {player.bio && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{player.bio}</p>}

        <div className="flex flex-wrap gap-1.5">
          {player.roles?.slice(0, 2).map((r) => (
            <span key={r} className="text-xs bg-pp-input-bg text-gray-600 border border-pp-border px-2 py-0.5 rounded-full">
              {getRoleIcon(r)} {r}
            </span>
          ))}
          {player.playstyleTags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-pp-orange-light text-pp-orange border border-orange-200 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {status === 'none' && (
          <>
            <button
              onClick={handlePass}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-pp-border text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
            <button
              onClick={handleSuperlike}
              disabled={sending || superlikeUsed}
              title={superlikeUsed ? 'Used this week' : '1 Superlike per week'}
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border transition-colors text-base ${
                superlikeUsed
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-amber-300 text-amber-500 hover:bg-amber-50 hover:border-amber-400'
              }`}
            >
              ⭐
            </button>
            <button
              onClick={handleConnect}
              disabled={sending || likesLeft <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-display font-bold text-sm tracking-wide text-white transition-colors disabled:opacity-40 ${
                likesLeft <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-pp-orange hover:bg-pp-orange-dark'
              }`}
            >
              {sending ? '...' : `🎮  Connect${likesLeft <= 0 ? ' (0 left)' : ''}`}
            </button>
          </>
        )}
        {status === 'pending_sent' && (
          <div className="flex-1 py-2.5 text-center text-xs text-gray-500 bg-pp-input-bg rounded-full border border-pp-border">
            ⏳ Request Sent
          </div>
        )}
        {status === 'pending_received' && (
          <div className="flex-1 py-2.5 text-center text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200">
            📨 Check Dashboard!
          </div>
        )}
        {status === 'connected' && (
          <div className="flex-1 py-2.5 text-center text-xs text-green-600 bg-green-50 rounded-full border border-green-200">
            ✅ Connected
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-gray-900 text-sm tracking-widest uppercase">Filters</h3>
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-pp-orange transition-colors">Reset</button>
      </div>

      <div>
        <label className="input-label">State</label>
        <select className="input" value={filters.region} onChange={(e) => set('region', e.target.value)}>
          <option value="">All India</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-pp-border bg-pp-input-bg opacity-50">
          <span className="text-xs text-gray-500">🌐 Cross Region</span>
          <span className="text-xs text-pp-orange font-semibold">Coming Soon</span>
        </div>
      </div>

      <div>
        <label className="input-label">Min Rank</label>
        <select className="input" value={filters.rankMin} onChange={(e) => set('rankMin', e.target.value)}>
          <option value="">Any</option>
          {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="input-label">Max Rank</label>
        <select className="input" value={filters.rankMax} onChange={(e) => set('rankMax', e.target.value)}>
          <option value="">Any</option>
          {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="input-label">Role</label>
        <div className="space-y-1.5">
          {ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio" name="role" value={role}
                checked={filters.role === role}
                onChange={() => set('role', filters.role === role ? '' : role)}
                className="accent-pp-orange"
              />
              <span className="text-xs text-gray-500 group-hover:text-gray-900 transition-colors">
                {getRoleIcon(role)} {role}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">Playstyle</label>
        <div className="flex flex-wrap gap-1.5">
          {PLAYSTYLES.map((tag) => (
            <button
              key={tag}
              onClick={() => set('playstyle', filters.playstyle === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                filters.playstyle === tag
                  ? 'bg-pp-orange border-pp-orange text-white'
                  : 'bg-white border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">Voice Chat</label>
        <select className="input" value={filters.voiceChat} onChange={(e) => set('voiceChat', e.target.value)}>
          <option value="">Any</option>
          <option value="required">Required</option>
          <option value="preferred">Preferred</option>
          <option value="optional">Optional</option>
          <option value="never">Text Only</option>
        </select>
      </div>

      <div>
        <label className="input-label">Gender</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {['Male', 'Female', 'Other'].map((g) => (
            <button
              key={g}
              onClick={() => set('gender', filters.gender === g ? '' : g)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filters.gender === g
                  ? 'bg-pp-orange border-pp-orange text-white'
                  : 'bg-white border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = { region: '', rankMin: '', rankMax: '', role: '', playstyle: '', voiceChat: '', gender: '' };

export default function FindDuoPage() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [passedIds, setPassedIds] = useState(() => getPassedProfiles());
  const [likesUsed, setLikesUsed] = useState(() => getTodayLikes());
  const [superlikeStatus, setSuperlikeStatus] = useState(() => getSuperlikeStatus());

  const likesLeft = DAILY_LIKE_LIMIT - likesUsed;
  const superlikeUsed = superlikeStatus.used;

  const fetchPlayers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/users/find-duo?${params}`);
      setPlayers(data.users);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load players'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPlayers(1); }, [filters]);

  const handleRequest = async (userId, isSuperlike = false) => {
    try {
      await api.post(`/users/request/${userId}`, { superlike: isSuperlike });
      toast.success(isSuperlike ? '⭐ Superlike sent!' : '🎮 Connect request sent!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
      return { success: false };
    }
  };

  const handleSuperlike = (userId) => handleRequest(userId, true);

  const handleLikeUsed = () => {
    const newCount = incrementLike();
    setLikesUsed(newCount);
    const remaining = DAILY_LIKE_LIMIT - newCount;
    if (remaining === 0) toast('No more connects today! Resets tomorrow.', { icon: '🎮' });
    else if (remaining <= 2) toast(`${remaining} connect${remaining === 1 ? '' : 's'} left today`, { icon: '🎮' });
  };

  const handleSuperlikeUsed = () => {
    useSuperlikeLocal();
    setSuperlikeStatus({ used: true, week: getWeekStart() });
    toast('Superlike used! Resets next Monday ⭐', { icon: '⭐' });
  };

  const handlePassed = (userId) => setPassedIds((prev) => ({ ...prev, [userId]: Date.now() }));

  const visiblePlayers = players.filter((p) => {
    const passTime = passedIds[p._id];
    return !passTime || Date.now() - passTime >= PASS_HIDE_MS;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-hero text-3xl text-gray-900 uppercase tracking-wide">Find Your Pair</h1>
          <p className="text-pp-subtle text-xs mt-1 font-display tracking-wide uppercase">
            {loading ? 'Searching...' : `${visiblePlayers.length} players`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            likesLeft > 0 ? 'border-orange-200 text-pp-orange bg-pp-orange-light' : 'border-pp-border text-gray-400'
          }`}>
            🎮 {likesLeft}/{DAILY_LIKE_LIMIT} today
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            !superlikeUsed ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-pp-border text-gray-400'
          }`}>
            ⭐ {superlikeUsed ? 'Used' : '1 left'} this week
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold uppercase transition-all lg:hidden ${
              activeFilterCount > 0 ? 'border-pp-orange bg-pp-orange text-white' : 'border-pp-border text-gray-500 bg-white'
            }`}
          >
            ⚙️ Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <aside className={`
          flex-shrink-0 w-56
          ${showFilters ? 'block' : 'hidden'} lg:block
          fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto
          bg-pp-bg lg:bg-transparent p-6 lg:p-0 overflow-y-auto
        `}>
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wider">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-900">✕</button>
          </div>
          <div className="bg-white border border-pp-border rounded-2xl p-5 sticky top-4 shadow-sm">
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
          </div>
        </aside>

        {/* Player grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-pp-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-60 bg-pp-input-bg" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-pp-input-bg rounded w-1/2" />
                    <div className="h-3 bg-pp-input-bg rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePlayers.length === 0 ? (
            <div className="bg-white border border-pp-border rounded-2xl p-16 text-center shadow-sm">
              <div className="text-5xl mb-4">😔</div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">No players found</h3>
              <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or check back later</p>
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <AnimatePresence>
                <div className="grid sm:grid-cols-2 gap-5">
                  {visiblePlayers.map((player, i) => (
                    <PlayerCard
                      key={player._id}
                      player={player}
                      onRequest={handleRequest}
                      onSuperlike={handleSuperlike}
                      index={i}
                      likesLeft={likesLeft}
                      superlikeUsed={superlikeUsed}
                      onLikeUsed={handleLikeUsed}
                      onSuperlikeUsed={handleSuperlikeUsed}
                      onPassed={handlePassed}
                    />
                  ))}
                </div>
              </AnimatePresence>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => fetchPlayers(pagination.page - 1)} disabled={pagination.page === 1} className="btn-secondary px-5 py-2 text-xs disabled:opacity-30 rounded-full">← Prev</button>
                  <span className="text-xs text-gray-500 px-3">{pagination.page} / {pagination.pages}</span>
                  <button onClick={() => fetchPlayers(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-secondary px-5 py-2 text-xs disabled:opacity-30 rounded-full">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

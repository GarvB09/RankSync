/**
 * FindDuoPage — Hinge-style browse with animations, pass tracking, daily like limit
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
const PASS_HIDE_MS = 48 * 60 * 60 * 1000; // 48 hours

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getPassedProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem('playpair-passed') || '{}');
    const now = Date.now();
    // Clean expired entries
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

// ─── Hinge-style Player Card ──────────────────────────────────────────────────
function PlayerCard({ player, onRequest, index, likesLeft, onLikeUsed, onPassed }) {
  const [status, setStatus] = useState(player.connectionStatus || 'none');
  const [sending, setSending] = useState(false);
  const [anim, setAnim] = useState(null); // 'like' | 'pass'
  const [visible, setVisible] = useState(true);

  const handleLike = async () => {
    if (likesLeft <= 0) {
      toast.error('No likes left today! Come back tomorrow 💔');
      return;
    }
    setAnim('like');
    setSending(true);
    setTimeout(async () => {
      const result = await onRequest(player._id);
      if (result.success) {
        setStatus('pending_sent');
        onLikeUsed();
      }
      setSending(false);
      setTimeout(() => setAnim(null), 300);
    }, 700);
  };

  const handlePass = () => {
    setAnim('pass');
    setTimeout(() => {
      passProfile(player._id);
      onPassed(player._id);
      setVisible(false);
    }, 600);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-valo-card border border-valo-border rounded-xl overflow-hidden flex flex-col group hover:border-valo-border/60 transition-colors relative"
    >
      {/* ── Like / Pass animation overlay ── */}
      <AnimatePresence>
        {anim && (
          <motion.div
            key={anim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-xl"
            style={{ background: anim === 'like' ? 'rgba(232,64,64,0.25)' : 'rgba(0,0,0,0.45)' }}
          >
            <motion.div
              initial={{ scale: 0.3, rotate: anim === 'like' ? -20 : 20 }}
              animate={{ scale: 1.2, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              {anim === 'like'
                ? <span className="text-8xl drop-shadow-lg">❤️</span>
                : <span className="text-8xl drop-shadow-lg font-bold text-white">✕</span>
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo / Avatar */}
      <div className="relative h-60 bg-valo-dark-3 overflow-hidden flex-shrink-0">
        {player.isOnline && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent z-10" />
        )}
        {player.avatar ? (
          <img
            src={player.avatar}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-hero text-[8rem] text-white/10 leading-none select-none">
              {player.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-valo-card via-valo-card/60 to-transparent" />

        {player.isOnline && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        )}

        <div className="absolute bottom-3 left-4 z-10">
          <span className={`font-mono font-bold text-sm drop-shadow-lg ${getRankColorClass(player.rank)}`}>
            {getRankEmoji(player.rank)} {player.rank}
          </span>
        </div>

        {(player.age || player.gender) && (
          <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5">
            {player.gender && (
              <span className="text-xs text-gray-300 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
                {player.gender === 'Male' ? '♂' : player.gender === 'Female' ? '♀' : '⚧'} {player.gender}
              </span>
            )}
            {player.age && (
              <span className="text-xs text-gray-300 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
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
            <h3 className="font-display font-bold text-white text-lg leading-tight">{player.username}</h3>
            {!player.isOnline && (
              <span className="text-xs text-gray-600">{formatLastSeen(player.lastSeen)}</span>
            )}
          </div>
          {player.riotId?.gameName && (
            <div className="text-xs text-gray-600 font-mono mt-0.5">
              {player.riotId.gameName}#{player.riotId.tagLine}
              <span className="mx-1.5 text-gray-700">·</span>
              {player.region}
            </div>
          )}
        </div>

        {player.bio && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{player.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {player.roles?.slice(0, 2).map((r) => (
            <span key={r} className="text-xs bg-valo-dark-3 text-gray-400 border border-valo-border px-2 py-0.5 rounded">
              {getRoleIcon(r)} {r}
            </span>
          ))}
          {player.playstyleTags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-valo-red/10 text-valo-red border border-valo-red/20 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-3">
        {status === 'none' && (
          <>
            <button
              onClick={handleLike}
              disabled={sending || likesLeft <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-display font-bold text-sm tracking-wide text-white transition-colors disabled:opacity-40 ${
                likesLeft <= 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-valo-red hover:bg-valo-red-dark'
              }`}
            >
              {sending ? '...' : `❤️  Like${likesLeft <= 0 ? ' (0 left)' : ''}`}
            </button>
            <button
              onClick={handlePass}
              className="w-12 flex items-center justify-center rounded-lg border border-valo-border text-gray-600 hover:text-white hover:border-gray-600 transition-colors text-lg"
            >
              ✕
            </button>
          </>
        )}
        {status === 'pending_sent' && (
          <div className="flex-1 py-2.5 text-center text-xs text-gray-500 bg-valo-dark-2 rounded-lg border border-valo-border">
            ⏳ Request Sent
          </div>
        )}
        {status === 'pending_received' && (
          <div className="flex-1 py-2.5 text-center text-xs text-valo-teal bg-valo-teal/10 rounded-lg border border-valo-teal/20">
            📨 Check Dashboard!
          </div>
        )}
        {status === 'connected' && (
          <div className="flex-1 py-2.5 text-center text-xs text-green-400 bg-green-400/10 rounded-lg border border-green-400/20">
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
        <h3 className="font-display font-bold text-white text-sm tracking-widest uppercase">Filters</h3>
        <button onClick={onReset} className="text-xs text-gray-600 hover:text-valo-red transition-colors">Reset</button>
      </div>

      <div>
        <label className="input-label">State</label>
        <select className="input" value={filters.region} onChange={(e) => set('region', e.target.value)}>
          <option value="">All India</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded border border-valo-border/30 bg-valo-dark-2 opacity-50">
          <span className="text-xs text-gray-600">🌐 Cross Region</span>
          <span className="text-xs text-valo-red font-display font-semibold">Coming Soon</span>
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
                type="radio"
                name="role"
                value={role}
                checked={filters.role === role}
                onChange={() => set('role', filters.role === role ? '' : role)}
                className="accent-valo-red"
              />
              <span className="text-xs text-gray-500 group-hover:text-white transition-colors">
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
              className={`text-xs px-2.5 py-1 rounded border transition-all ${
                filters.playstyle === tag
                  ? 'bg-valo-red/20 border-valo-red text-valo-red'
                  : 'bg-valo-dark-2 border-valo-border text-gray-500 hover:border-gray-600'
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = { region: '', rankMin: '', rankMax: '', role: '', playstyle: '', voiceChat: '' };

export default function FindDuoPage() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [passedIds, setPassedIds] = useState(() => getPassedProfiles());
  const [likesUsed, setLikesUsed] = useState(() => getTodayLikes());

  const likesLeft = DAILY_LIKE_LIMIT - likesUsed;

  const fetchPlayers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/users/find-duo?${params}`);
      setPlayers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPlayers(1); }, [filters]);

  const handleRequest = async (userId) => {
    try {
      await api.post(`/users/request/${userId}`);
      toast.success('Duo request sent!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
      return { success: false };
    }
  };

  const handleLikeUsed = () => {
    const newCount = incrementLike();
    setLikesUsed(newCount);
    const remaining = DAILY_LIKE_LIMIT - newCount;
    if (remaining === 0) toast('No more likes today! Resets tomorrow.', { icon: '💔' });
    else if (remaining <= 2) toast(`${remaining} like${remaining === 1 ? '' : 's'} left today`, { icon: '❤️' });
  };

  const handlePassed = (userId) => {
    setPassedIds((prev) => ({ ...prev, [userId]: Date.now() }));
  };

  // Filter out passed profiles
  const visiblePlayers = players.filter((p) => {
    const passTime = passedIds[p._id];
    if (!passTime) return true;
    return Date.now() - passTime >= PASS_HIDE_MS;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-hero text-3xl text-white uppercase tracking-wide">Find Your Pair</h1>
          <p className="text-gray-600 text-xs mt-1 font-display tracking-wide uppercase">
            {loading ? 'Searching...' : `${visiblePlayers.length} players`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Daily likes counter */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-display font-semibold ${
            likesLeft > 0 ? 'border-valo-red/30 text-valo-red bg-valo-red/5' : 'border-valo-border text-gray-600'
          }`}>
            ❤️ {likesLeft}/{DAILY_LIKE_LIMIT} today
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded border text-xs font-display font-semibold tracking-wide uppercase transition-all lg:hidden ${
              activeFilterCount > 0 ? 'border-valo-red text-valo-red' : 'border-valo-border text-gray-500'
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
          bg-valo-dark lg:bg-transparent p-6 lg:p-0 overflow-y-auto
        `}>
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="bg-valo-card border border-valo-border rounded-xl p-5 sticky top-4">
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
          </div>
        </aside>

        {/* Player grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-valo-card border border-valo-border rounded-xl overflow-hidden animate-pulse">
                  <div className="h-60 bg-valo-dark-3" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-valo-dark-3 rounded w-1/2" />
                    <div className="h-3 bg-valo-dark-3 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePlayers.length === 0 ? (
            <div className="bg-valo-card border border-valo-border rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">😔</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">No players found</h3>
              <p className="text-gray-600 text-sm mb-6">Try adjusting your filters or check back later</p>
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
                      index={i}
                      likesLeft={likesLeft}
                      onLikeUsed={handleLikeUsed}
                      onPassed={handlePassed}
                    />
                  ))}
                </div>
              </AnimatePresence>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => fetchPlayers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary px-5 py-2 text-xs disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-600 px-3 font-display uppercase tracking-wide">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchPlayers(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary px-5 py-2 text-xs disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

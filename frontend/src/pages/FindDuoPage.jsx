/**
 * FindDuoPage — Browse and filter players for matchmaking
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
  RANKS, REGIONS, ROLES, PLAYSTYLES,
  getRankColorClass, getRankEmoji, getRoleIcon, formatLastSeen,
} from '../utils/rankUtils';
import toast from 'react-hot-toast';

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player, onRequest, index }) {
  const [status, setStatus] = useState(player.connectionStatus || 'none');
  const [sending, setSending] = useState(false);

  const handleRequest = async () => {
    setSending(true);
    const result = await onRequest(player._id);
    if (result.success) setStatus('pending_sent');
    setSending(false);
  };

  const vcLabel = {
    required: '🎙️ Voice Required',
    preferred: '🎙️ Voice Preferred',
    optional: '🎙️ Optional',
    never: '💬 Text Only',
  }[player.voiceChatPreference] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="card-hover p-5 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Online indicator strip */}
      {player.isOnline && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-valo-dark-3 border-2 border-valo-border flex items-center justify-center text-xl font-bold overflow-hidden">
            {player.avatar
              ? <img src={player.avatar} alt="" className="w-full h-full object-cover" />
              : player.username[0].toUpperCase()
            }
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 ${player.isOnline ? 'status-online' : 'status-offline'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-white text-base truncate">{player.username}</h3>
            {player.isOnline && (
              <span className="text-xs text-green-400 font-medium flex-shrink-0">● Online</span>
            )}
          </div>
          {player.riotId?.gameName && (
            <div className="text-xs text-gray-500 font-mono truncate">
              {player.riotId.gameName}#{player.riotId.tagLine}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-mono font-semibold ${getRankColorClass(player.rank)}`}>
              {getRankEmoji(player.rank)} {player.rank}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-400">{player.region}</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {player.bio && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{player.bio}</p>
      )}

      {/* Roles */}
      {player.roles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {player.roles.map((r) => (
            <span key={r} className="text-xs bg-valo-dark-3 text-gray-300 border border-valo-border px-2 py-0.5 rounded">
              {getRoleIcon(r)} {r}
            </span>
          ))}
        </div>
      )}

      {/* Playstyle tags */}
      {player.playstyleTags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {player.playstyleTags.map((tag) => (
            <span key={tag} className="text-xs bg-valo-red/10 text-valo-red border border-valo-red/20 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-valo-border">
        <span className="text-xs text-gray-500">{vcLabel}</span>
        {!player.isOnline && (
          <span className="text-xs text-gray-600">{formatLastSeen(player.lastSeen)}</span>
        )}
      </div>

      {/* Action button */}
      {status === 'none' && (
        <button
          onClick={handleRequest}
          disabled={sending}
          className="btn-primary w-full py-2 text-xs"
        >
          {sending ? 'Sending...' : '🤝 Send Duo Request'}
        </button>
      )}
      {status === 'pending_sent' && (
        <div className="w-full py-2 text-center text-xs text-gray-400 bg-valo-dark-2 rounded border border-valo-border">
          ⏳ Request Sent
        </div>
      )}
      {status === 'pending_received' && (
        <div className="w-full py-2 text-center text-xs text-valo-teal bg-valo-teal/10 rounded border border-valo-teal/20">
          📨 They sent you a request — check Dashboard!
        </div>
      )}
      {status === 'connected' && (
        <div className="w-full py-2 text-center text-xs text-green-400 bg-green-400/10 rounded border border-green-400/20">
          ✅ Already Connected
        </div>
      )}
    </motion.div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-white tracking-wide">FILTERS</h3>
        <button onClick={onReset} className="text-xs text-gray-500 hover:text-valo-red transition-colors">
          Reset all
        </button>
      </div>

      {/* Region */}
      <div>
        <label className="input-label">Region</label>
        <select
          className="input"
          value={filters.region}
          onChange={(e) => set('region', e.target.value)}
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Rank range */}
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

      {/* Role */}
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
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                {getRoleIcon(role)} {role}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Playstyle */}
      <div>
        <label className="input-label">Playstyle</label>
        <div className="flex flex-wrap gap-2">
          {PLAYSTYLES.map((tag) => (
            <button
              key={tag}
              onClick={() => set('playstyle', filters.playstyle === tag ? '' : tag)}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                filters.playstyle === tag
                  ? 'bg-valo-red/20 border-valo-red text-valo-red'
                  : 'bg-valo-dark-2 border-valo-border text-gray-400 hover:border-gray-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Voice chat */}
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

  const fetchPlayers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
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
      toast.success('Duo request sent! 🎮');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
      return { success: false };
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide flex items-center gap-3">
            <span className="text-valo-red">🎯</span> FIND YOUR DUO
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Searching...' : `${pagination.total} players found`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 lg:hidden ${activeFilterCount > 0 ? 'border-valo-red text-valo-red' : ''}`}
        >
          <span>⚙️</span>
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar — desktop always visible, mobile toggleable */}
        <aside className={`
          flex-shrink-0 w-64
          ${showFilters ? 'block' : 'hidden'} lg:block
          fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto
          bg-valo-dark lg:bg-transparent p-6 lg:p-0 overflow-y-auto
        `}>
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-white">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="card p-5 sticky top-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </aside>

        {/* Player grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 h-64 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-valo-dark-3" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-valo-dark-3 rounded w-3/4" />
                      <div className="h-3 bg-valo-dark-3 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-valo-dark-3 rounded" />
                    <div className="h-3 bg-valo-dark-3 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="font-display font-bold text-xl text-white mb-2">No players found</h3>
              <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or check back later</p>
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {players.map((player, i) => (
                  <PlayerCard key={player._id} player={player} onRequest={handleRequest} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => fetchPlayers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary px-4 py-2 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-400 px-4">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchPlayers(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary px-4 py-2 disabled:opacity-40"
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

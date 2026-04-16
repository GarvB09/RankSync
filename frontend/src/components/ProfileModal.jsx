/**
 * ProfileModal — full player profile in a slide-over panel
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api, { API_URL } from '../utils/api';
import {
  getRankColorClass, getRankEmoji, getRankIcon,
  getRoleIcon, getRegionFlagUrl, formatLastSeen, getAgentIcon,
} from '../utils/rankUtils';
import RankIcon from './RankIcon';
import toast from 'react-hot-toast';

export default function ProfileModal({ username, onClose, currentUserId, connections, sentRequests }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState('none');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setProfile(null);
    api.get(`/users/profile/${username}`)
      .then(({ data }) => {
        const p = data.user;
        setProfile(p);
        if (currentUserId && p._id !== currentUserId) {
          if (connections?.some((c) => c === p._id || c?._id === p._id)) setRequestStatus('connected');
          else if (sentRequests?.some((r) => r === p._id || r?._id === p._id)) setRequestStatus('pending_sent');
          else setRequestStatus('none');
        }
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleRequest = async () => {
    try {
      await api.post(`/users/request/${profile._id}`);
      setRequestStatus('pending_sent');
      toast.success('Duo request sent! 🎮');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleMessage = async () => {
    try {
      const { data } = await api.post(`/chat/start/${profile._id}`);
      onClose();
      navigate(`/chat/${data.conversation._id}`);
    } catch { toast.error('Failed to start chat'); }
  };

  const vcLabel = profile ? {
    required: '🎙️ Voice Required', preferred: '🎙️ Voice Preferred',
    optional: '🎙️ Optional', never: '💬 Text Only',
  }[profile.voiceChatPreference] : null;

  return (
    <AnimatePresence>
      {username && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm overflow-y-auto flex flex-col"
            style={{ backgroundColor: 'var(--pp-surface)', borderLeft: '1px solid var(--pp-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 backdrop-blur-md z-10"
                 style={{ borderColor: 'var(--pp-border)', backgroundColor: 'var(--pp-surface)' }}>
              <span className="font-hero text-lg text-pp-orange tracking-wide">Player Profile</span>
              <div className="flex items-center gap-2">
                {profile && (
                  <button
                    onClick={() => { onClose(); navigate(`/profile/${profile.username}`); }}
                    className="text-xs px-3 py-1.5 rounded-xl border border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange transition-colors font-medium"
                  >
                    Full Profile →
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-pp-input-bg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-pp-orange border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Loading profile...</span>
                </div>
              </div>
            ) : !profile ? (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <div className="text-4xl mb-3">😔</div>
                  <p className="text-gray-500">Profile not found</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-5 space-y-5">

                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pp-orange/30"
                         style={{ boxShadow: '0 0 0 2px #FF6B0040' }}>
                      {profile.avatar
                        ? <img src={profile.avatar.startsWith('/uploads') ? `${API_URL}${profile.avatar}` : profile.avatar}
                               alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-pp-orange"
                               style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                            {profile.username[0].toUpperCase()}
                          </div>
                      }
                    </div>
                    <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${profile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>

                  <div>
                    <h2 className="font-display font-bold text-xl" style={{ color: 'inherit' }}>{profile.username}</h2>
                    {profile.riotId?.gameName && (
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--pp-muted)' }}>
                        {profile.riotId.gameName}#{profile.riotId.tagLine}
                      </div>
                    )}
                    <div className="text-xs mt-1" style={{ color: 'var(--pp-subtle)' }}>
                      {profile.isOnline ? <span className="text-green-500 font-medium">● Online</span> : `Last seen ${formatLastSeen(profile.lastSeen)}`}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 w-full">
                    {requestStatus === 'none' && (
                      <button onClick={handleRequest} className="btn-primary flex-1 text-xs py-2">
                        🎮 Send Request
                      </button>
                    )}
                    {requestStatus === 'pending_sent' && (
                      <div className="flex-1 text-center text-xs py-2 rounded-xl border font-medium"
                           style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-muted)' }}>
                        ⏳ Pending
                      </div>
                    )}
                    {requestStatus === 'connected' && (
                      <button onClick={handleMessage} className="btn-primary flex-1 text-xs py-2">
                        💬 Message
                      </button>
                    )}
                    {profile.trackerUrl && (
                      <a href={profile.trackerUrl} target="_blank" rel="noopener noreferrer"
                         className="px-3 py-2 rounded-xl border border-orange-200 bg-pp-orange-light text-pp-orange text-xs font-semibold hover:bg-orange-100 transition-colors flex items-center">
                        🔗
                      </a>
                    )}
                  </div>
                </div>

                {/* Rank + region */}
                <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Rank</span>
                    <span className={`font-mono font-bold flex items-center gap-1.5 ${getRankColorClass(profile.rank)}`}>
                      <RankIcon rank={profile.rank} size="w-5 h-5" />
                      {profile.rank || 'Unranked'}
                    </span>
                  </div>
                  {profile.region && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Region</span>
                      <span className="text-sm flex items-center gap-1.5" style={{ color: 'inherit' }}>
                        {getRegionFlagUrl(profile.region) && (
                          <img src={getRegionFlagUrl(profile.region)} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                        )}
                        {profile.region}
                      </span>
                    </div>
                  )}
                  {vcLabel && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Voice</span>
                      <span className="text-sm" style={{ color: 'inherit' }}>{vcLabel}</span>
                    </div>
                  )}
                  {profile.age && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Age</span>
                      <span className="text-sm" style={{ color: 'inherit' }}>{profile.age}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pp-muted)' }}>About</div>
                    <p className="text-sm leading-relaxed" style={{ color: 'inherit' }}>{profile.bio}</p>
                  </div>
                )}

                {/* Roles + playstyle */}
                {(profile.roles?.length > 0 || profile.playstyleTags?.length > 0) && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Playstyle</div>
                    {profile.roles?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.roles.map((r) => (
                          <span key={r} className="text-xs px-2.5 py-1 rounded-full border font-medium"
                                style={{ borderColor: 'var(--pp-border)', color: 'inherit', backgroundColor: 'var(--pp-surface)' }}>
                            {getRoleIcon(r)} {r}
                          </span>
                        ))}
                      </div>
                    )}
                    {profile.playstyleTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.playstyleTags.map((tag) => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-orange-200 bg-pp-orange-light text-pp-orange font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Favorite agents */}
                {profile.favoriteAgents?.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--pp-muted)' }}>Fav Agents</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.favoriteAgents.map((agent) => {
                        const icon = getAgentIcon(agent);
                        return (
                          <span key={agent} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm font-medium"
                                style={{ borderColor: 'var(--pp-border)', color: 'inherit', backgroundColor: 'var(--pp-surface)' }}>
                            {icon
                              ? <img src={icon} alt={agent} className="w-4 h-4 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                              : <span>🦸</span>
                            }
                            {agent}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Looking for */}
                {profile.preferredRankMin && (
                  <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pp-muted)' }}>Looking For</div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-semibold text-sm ${getRankColorClass(profile.preferredRankMin)}`}>
                        {getRankEmoji(profile.preferredRankMin)} {profile.preferredRankMin}
                      </span>
                      <span style={{ color: 'var(--pp-border)' }}>—</span>
                      <span className={`font-mono font-semibold text-sm ${getRankColorClass(profile.preferredRankMax)}`}>
                        {getRankEmoji(profile.preferredRankMax)} {profile.preferredRankMax}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

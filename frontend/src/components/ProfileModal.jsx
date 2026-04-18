/**
 * ProfileModal — full player profile in a centered dialog
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api, { API_URL } from '../utils/api';
import {
  getRankColorClass, getRankEmoji,
  getRoleIcon, getRegionFlagUrl, formatLastSeen, getAgentIcon,
  getLolRankColorClass, getLolRankIcon, getLolRegionFlagUrl, LOL_REGION_NAMES,
  getLolLaneIcon, getLolChampionIcon, getLolChampionDisplay,
} from '../utils/rankUtils';
import RankIcon from './RankIcon';

function LolRankIcon({ rank, size = 'w-7 h-7' }) {
  const src = getLolRankIcon(rank);
  if (!src) return null;
  return <img src={src} alt={rank} className={`${size} object-contain`} onError={(e) => { e.target.style.display = 'none'; }} />;
}
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

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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

          {/* Centered modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
              style={{
                backgroundColor: 'var(--pp-surface)',
                border: '1px solid var(--pp-border)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Sticky header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                   style={{ borderColor: 'var(--pp-border)' }}>
                <span className="font-hero text-xl text-pp-orange tracking-wide">Player Profile</span>
                <div className="flex items-center gap-2">
                  {profile && (
                    <button
                      onClick={() => { onClose(); navigate(`/profile/${profile.username}`); }}
                      className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors hover:border-pp-orange hover:text-pp-orange"
                      style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-muted)' }}
                    >
                      Full Profile →
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-pp-input-bg"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* ── Scrollable body ── */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-pp-orange border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm" style={{ color: 'var(--pp-muted)' }}>Loading profile...</span>
                    </div>
                  </div>
                ) : !profile ? (
                  <div className="flex items-center justify-center h-64 text-center px-6">
                    <div>
                      <div className="text-4xl mb-3">😔</div>
                      <p style={{ color: 'var(--pp-muted)' }}>Profile not found</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-5">

                    {/* ── Avatar + identity ── */}
                    <div className="flex items-center gap-5">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2"
                             style={{ borderColor: 'var(--pp-border)' }}>
                          {profile.avatar
                            ? <img src={profile.avatar.startsWith('/uploads') ? `${API_URL}${profile.avatar}` : profile.avatar}
                                   alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-pp-orange"
                                   style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                                {profile.username[0].toUpperCase()}
                              </div>
                          }
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${profile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                              style={{ borderColor: 'var(--pp-surface)' }} />
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display font-bold text-2xl truncate">{profile.username}</h2>
                        {profile.riotId?.gameName && (
                          <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--pp-muted)' }}>
                            {profile.riotId.gameName}#{profile.riotId.tagLine}
                          </div>
                        )}
                        <div className="text-xs mt-1">
                          {profile.isOnline
                            ? <span className="text-green-500 font-semibold">● Online</span>
                            : <span style={{ color: 'var(--pp-subtle)' }}>Last seen {formatLastSeen(profile.lastSeen)}</span>
                          }
                        </div>

                        {/* Rank inline */}
                        {profile.game === 'lol' ? (
                          <div className={`mt-2 flex items-center gap-1.5 font-mono font-bold text-base ${getLolRankColorClass(profile.lolRank)}`}>
                            <LolRankIcon rank={profile.lolRank} />
                            {profile.lolRank || 'Unranked'}
                          </div>
                        ) : (
                          <div className={`mt-2 flex items-center gap-1.5 font-mono font-bold text-base ${getRankColorClass(profile.rank)}`}>
                            <RankIcon rank={profile.rank} size="w-7 h-7" />
                            {profile.rank || 'Unranked'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="flex gap-2">
                      {requestStatus === 'none' && (
                        <button onClick={handleRequest} className="btn-primary flex-1 text-sm py-2.5">
                          🎮 Send Request
                        </button>
                      )}
                      {requestStatus === 'pending_sent' && (
                        <div className="flex-1 text-center text-sm py-2.5 rounded-xl border font-medium"
                             style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-muted)' }}>
                          ⏳ Request Pending
                        </div>
                      )}
                      {requestStatus === 'connected' && (
                        <button onClick={handleMessage} className="btn-primary flex-1 text-sm py-2.5">
                          💬 Message
                        </button>
                      )}
                      {profile.trackerUrl && (
                        <a href={profile.trackerUrl} target="_blank" rel="noopener noreferrer"
                           className="px-4 py-2.5 rounded-xl border border-orange-200 bg-pp-orange-light text-pp-orange text-sm font-semibold hover:bg-orange-100 transition-colors flex items-center gap-1.5">
                          🔗 Verify
                        </a>
                      )}
                    </div>

                    {/* ── Info grid ── */}
                    <div className="grid grid-cols-2 gap-3">
                      {profile.game === 'lol' ? (
                        profile.lolRegion && (
                          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pp-muted)' }}>Server</div>
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {getLolRegionFlagUrl(profile.lolRegion) && (
                                <img src={getLolRegionFlagUrl(profile.lolRegion)} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                              )}
                              <span className="font-bold text-blue-600">{profile.lolRegion}</span>
                              <span className="text-xs text-gray-400">{LOL_REGION_NAMES[profile.lolRegion]}</span>
                            </div>
                          </div>
                        )
                      ) : (
                        profile.region && (
                          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pp-muted)' }}>Region</div>
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {getRegionFlagUrl(profile.region) && (
                                <img src={getRegionFlagUrl(profile.region)} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                              )}
                              {profile.region}
                            </div>
                          </div>
                        )
                      )}
                      {vcLabel && (
                        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pp-muted)' }}>Voice Chat</div>
                          <div className="text-sm font-medium">{vcLabel}</div>
                        </div>
                      )}
                      {profile.age && (
                        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pp-muted)' }}>Age</div>
                          <div className="text-sm font-medium">{profile.age}</div>
                        </div>
                      )}
                      {profile.gender && (
                        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pp-muted)' }}>Gender</div>
                          <div className="text-sm font-medium">{profile.gender}</div>
                        </div>
                      )}
                    </div>

                    {/* ── Bio ── */}
                    {profile.bio && (
                      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--pp-muted)' }}>About</div>
                        <p className="text-sm leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* ── Roles/Lanes + playstyle ── */}
                    {(profile.roles?.length > 0 || profile.lolLanes?.length > 0 || profile.playstyleTags?.length > 0) && (
                      <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--pp-muted)' }}>Playstyle</div>
                        {profile.game === 'lol' && profile.lolLanes?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.lolLanes.map((lane) => (
                              <span key={lane} className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium">
                                {getLolLaneIcon(lane)} {lane}
                              </span>
                            ))}
                          </div>
                        )}
                        {profile.game !== 'lol' && profile.roles?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.roles.map((r) => (
                              <span key={r} className="text-xs px-3 py-1.5 rounded-full border font-medium"
                                    style={{ borderColor: 'var(--pp-border)', backgroundColor: 'var(--pp-surface)' }}>
                                {getRoleIcon(r)} {r}
                              </span>
                            ))}
                          </div>
                        )}
                        {profile.playstyleTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.playstyleTags.map((tag) => (
                              <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-orange-200 bg-pp-orange-light text-pp-orange font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Favorite Champions (LoL) ── */}
                    {profile.game === 'lol' && profile.favoriteChampions?.length > 0 && (
                      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--pp-muted)' }}>Favourite Champions</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.favoriteChampions.map((key) => (
                            <span key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-sm font-medium text-blue-800"
                                  style={{ backgroundColor: 'var(--pp-surface)' }}>
                              <img src={getLolChampionIcon(key)} alt={key} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                              {getLolChampionDisplay(key)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Favorite Agents (Valorant) ── */}
                    {profile.game !== 'lol' && profile.favoriteAgents?.length > 0 && (
                      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--pp-muted)' }}>Favourite Agents</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.favoriteAgents.map((agent) => {
                            const icon = getAgentIcon(agent);
                            return (
                              <span key={agent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium"
                                    style={{ borderColor: 'var(--pp-border)', backgroundColor: 'var(--pp-surface)' }}>
                                {icon
                                  ? <img src={icon} alt={agent} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                  : <span>🦸</span>
                                }
                                {agent}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Looking for ── */}
                    {profile.preferredRankMin && (
                      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pp-input-bg)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--pp-muted)' }}>Looking For</div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm flex items-center gap-1.5 ${getRankColorClass(profile.preferredRankMin)}`}>
                            <RankIcon rank={profile.preferredRankMin} size="w-6 h-6" />
                            {profile.preferredRankMin}
                          </span>
                          <span style={{ color: 'var(--pp-border)' }}>—</span>
                          <span className={`font-mono font-bold text-sm flex items-center gap-1.5 ${getRankColorClass(profile.preferredRankMax)}`}>
                            <RankIcon rank={profile.preferredRankMax} size="w-6 h-6" />
                            {profile.preferredRankMax}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * ProfilePage — View own or another player's profile
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import api, { API_URL } from '../utils/api';
import { getRankColorClass, getRankEmoji, getRankIcon, getRoleIcon, getRegionFlagUrl, formatLastSeen, getAgentIcon } from '../utils/rankUtils';
import RankIcon from '../components/RankIcon';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState('none');

  const targetUsername = username || me?.username;
  const isOwnProfile = !username || username === me?.username;

  useEffect(() => {
    if (!targetUsername) return;
    setLoading(true);
    api.get(`/users/profile/${targetUsername}`)
      .then(({ data }) => {
        setProfile(data.user);
        if (!isOwnProfile && me) {
          if (me.connections?.some((c) => c._id === data.user._id || c === data.user._id)) setRequestStatus('connected');
          else if (me.sentRequests?.some((r) => r._id === data.user._id || r === data.user._id)) setRequestStatus('pending_sent');
        }
      })
      .catch(() => toast.error('Player not found'))
      .finally(() => setLoading(false));
  }, [targetUsername]);

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
      navigate(`/chat/${data.conversation._id}`);
    } catch { toast.error('Failed to start chat'); }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="card p-8 animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-full bg-pp-input-bg" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 bg-pp-input-bg rounded w-1/3" />
              <div className="h-4 bg-pp-input-bg rounded w-1/4" />
            </div>
          </div>
          <div className="h-24 bg-pp-input-bg rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="font-display font-bold text-xl text-gray-900">Player not found</h2>
        <Link to="/find-duo" className="btn-primary mt-4 inline-flex">Browse Players</Link>
      </div>
    );
  }

  const vcLabel = {
    required: '🎙️ Voice Required', preferred: '🎙️ Voice Preferred',
    optional: '🎙️ Optional', never: '💬 Text Only',
  }[profile.voiceChatPreference];

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-6">
      {!isOwnProfile && (
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-900 transition-colors text-sm">
          ← Back
        </button>
      )}

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-pp-input-bg border-2 border-pp-border flex items-center justify-center overflow-hidden">
              {profile.avatar
                ? <img src={profile.avatar.startsWith('/uploads') ? `${API_URL}${profile.avatar}` : profile.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-gray-600 text-3xl font-bold">{profile.username[0].toUpperCase()}</span>
              }
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${profile.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-gray-900">{profile.username}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                profile.isOnline ? 'bg-green-50 border-green-200 text-green-600' : 'bg-pp-input-bg border-pp-border text-gray-400'
              }`}>
                {profile.isOnline ? '● Online' : `⚫ ${formatLastSeen(profile.lastSeen)}`}
              </span>
            </div>
            {profile.riotId?.gameName && (
              <div className="text-sm text-gray-400 font-mono mt-0.5">
                {profile.riotId.gameName}#{profile.riotId.tagLine}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`font-mono font-bold flex items-center gap-2 ${getRankColorClass(profile.rank)}`}>
                <RankIcon rank={profile.rank} size="w-8 h-8" />
                <span className="text-lg">{profile.rank || 'Unranked'}</span>
              </span>
              <span className="text-gray-300">·</span>
              {profile.region && (
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <img src={getRegionFlagUrl(profile.region)} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                  {profile.region}
                </span>
              )}
              {vcLabel && <><span className="text-gray-300">·</span><span className="text-sm text-gray-500">{vcLabel}</span></>}
            </div>
            {profile.trackerUrl && (
              <a
                href={profile.trackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-pp-orange-light border border-orange-200 text-pp-orange text-xs font-semibold hover:bg-orange-100 transition-colors"
              >
                🔗 Verify Rank
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {isOwnProfile ? (
              <Link to="/profile/edit" className="btn-primary text-xs px-4 py-2">✏️ Edit</Link>
            ) : (
              <>
                {requestStatus === 'none' && <button onClick={handleRequest} className="btn-primary text-xs px-4 py-2">🎮 Send Request</button>}
                {requestStatus === 'pending_sent' && <div className="text-xs text-gray-500 border border-pp-border rounded-xl px-4 py-2 text-center bg-pp-input-bg">⏳ Pending</div>}
                {requestStatus === 'connected' && <button onClick={handleMessage} className="btn-primary text-xs px-4 py-2">💬 Message</button>}
              </>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 p-3 bg-pp-input-bg rounded-xl border border-pp-border">
            <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </motion.div>

      {/* Playstyle */}
      {(profile.roles?.length > 0 || profile.playstyleTags?.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-base text-gray-900">PLAYSTYLE</h2>
          {profile.roles?.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Roles</div>
              <div className="flex flex-wrap gap-2">
                {profile.roles.map((r) => (
                  <span key={r} className="px-3 py-1.5 bg-pp-input-bg border border-pp-border rounded-full text-sm text-gray-600">
                    {getRoleIcon(r)} {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.playstyleTags?.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {profile.playstyleTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-pp-orange-light border border-orange-200 rounded-full text-xs text-pp-orange font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Looking for */}
      {profile.preferredRankMin && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
          <h2 className="font-display font-bold text-base text-gray-900 mb-3">LOOKING FOR</h2>
          <div className="flex items-center gap-3">
            <span className={`font-mono font-semibold text-sm ${getRankColorClass(profile.preferredRankMin)}`}>
              {getRankEmoji(profile.preferredRankMin)} {profile.preferredRankMin}
            </span>
            <span className="text-gray-300">—</span>
            <span className={`font-mono font-semibold text-sm ${getRankColorClass(profile.preferredRankMax)}`}>
              {getRankEmoji(profile.preferredRankMax)} {profile.preferredRankMax}
            </span>
          </div>
        </motion.div>
      )}

      {/* Favorite agents */}
      {profile.favoriteAgents?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <h2 className="font-display font-bold text-base text-gray-900 mb-3">FAVORITE AGENTS</h2>
          <div className="flex flex-wrap gap-2">
            {profile.favoriteAgents.map((agent) => {
              const icon = getAgentIcon(agent);
              return (
                <span key={agent} className="flex items-center gap-1.5 px-3 py-1.5 bg-pp-input-bg border border-pp-border rounded-full text-sm text-gray-600">
                  {icon
                    ? <img src={icon} alt={agent} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    : <span>🦸</span>
                  }
                  {agent}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Squad */}
      {isOwnProfile && profile.connections?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">YOUR SQUAD ({profile.connections.length})</h2>
          <div className="flex flex-wrap gap-3">
            {profile.connections.map((conn) => (
              <Link key={conn._id} to={`/profile/${conn.username}`}
                className="flex items-center gap-2 p-2 bg-pp-input-bg border border-pp-border rounded-xl hover:border-pp-orange transition-colors"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-pp-border flex items-center justify-center overflow-hidden">
                    {conn.avatar
                      ? <img src={conn.avatar.startsWith('/uploads') ? `${API_URL}${conn.avatar}` : conn.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-gray-600 font-bold text-xs">{conn.username[0].toUpperCase()}</span>
                    }
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${conn.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">{conn.username}</div>
                  <div className={`text-xs font-mono ${getRankColorClass(conn.rank)}`}>{conn.rank}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

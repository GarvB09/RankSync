/**
 * DashboardPage
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import { getRankColorClass, getRankEmoji, getRankIcon, getRoleIcon, getRegionFlagUrl, formatLastSeen } from '../utils/rankUtils';
import toast from 'react-hot-toast';

const STAT_ACCENTS = [
  'from-orange-400/20 to-orange-300/5 border-orange-200/60',
  'from-blue-400/15 to-blue-300/5 border-blue-200/60',
  'from-purple-400/15 to-purple-300/5 border-purple-200/60',
  'from-emerald-400/15 to-emerald-300/5 border-emerald-200/60',
];

const StatCard = ({ label, value, sub, delay = 0, accent = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`relative overflow-hidden rounded-2xl p-5 backdrop-blur-md border bg-gradient-to-br ${STAT_ACCENTS[accent]}`}
    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)' }}
  >
    <div className="text-3xl font-display font-bold text-gray-900">{value}</div>
    <div className="text-sm font-semibold text-gray-600 mt-1">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    {/* Decorative orb */}
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/20 blur-xl pointer-events-none" />
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [connections, setConnections] = useState({ connections: [], receivedRequests: [], sentRequests: [] });
  useEffect(() => {
    api.get('/users/connections')
      .then(({ data }) => setConnections(data))
      .catch(() => {});
  }, []);

  const handleAccept = async (userId) => {
    try {
      await api.post(`/users/request/${userId}/accept`);
      toast.success('Duo request accepted! 🎮');
      const { data } = await api.get('/users/connections');
      setConnections(data);
    } catch { toast.error('Failed to accept request'); }
  };

  const handleDecline = async (userId) => {
    try {
      await api.post(`/users/request/${userId}/decline`);
      const { data } = await api.get('/users/connections');
      setConnections(data);
    } catch { toast.error('Failed to decline request'); }
  };

  const profileComplete = user?.isProfileComplete;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 tracking-wide">
            Welcome back, <span className="text-pp-orange">{user?.username}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {getRankIcon(user?.rank)
              ? <img src={getRankIcon(user?.rank)} alt="" className="inline w-4 h-4 object-contain mr-1 -mt-0.5" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.45))'}} />
              : getRankEmoji(user?.rank) + ' '
            }{user?.rank || 'Unranked'} ·{' '}
            {user?.region
              ? <span className="inline-flex items-center gap-1">
                  <img src={getRegionFlagUrl(user.region)} alt="" className="inline w-4 h-3 object-cover rounded-sm" />
                  {user.region}
                </span>
              : 'No region set'
            }
          </p>
        </div>
        <Link to="/find-duo" className="btn-primary">
          🎮 Find Duo
        </Link>
      </div>

      {/* Profile incomplete banner */}
      {!profileComplete && (
        <motion.div
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between p-4 bg-pp-orange-light border border-orange-200 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-pp-orange text-xl">⚠️</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Complete your profile</div>
              <div className="text-gray-500 text-xs">Link your Riot account and set your roles to appear in matchmaking</div>
            </div>
          </div>
          <Link to="/profile/edit" className="btn-primary text-xs px-4 py-2">Set Up Profile</Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Connections" value={connections.connections.length} sub="Active duos" delay={0.05} accent={0} />
        <StatCard label="Pending" value={connections.receivedRequests.length} sub="Awaiting your reply" delay={0.1} accent={1} />
        <StatCard label="Rank" value={user?.rank?.split(' ')[0] || '—'} sub={user?.rank || 'Link Riot account'} delay={0.15} accent={2} />
        <StatCard
          label="Region"
          value={user?.region
            ? <span className="flex items-center gap-2">
                <img src={getRegionFlagUrl(user.region)} alt="" className="w-7 h-5 object-cover rounded-sm" />
                {user.region}
              </span>
            : '—'}
          sub={user?.region ? 'Asia Pacific' : 'Set in profile'}
          delay={0.2} accent={3}
        />
      </div>

      {/* Incoming requests */}
      {connections.receivedRequests.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg text-gray-900 tracking-wide mb-4 flex items-center gap-2">
            🤝 Duo Requests
            <span className="ml-2 bg-pp-orange text-white text-xs rounded-full px-2 py-0.5 font-mono">
              {connections.receivedRequests.length}
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.receivedRequests.map((requester, i) => (
              <motion.div
                key={requester._id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-pp-input-bg border border-pp-border flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                  {requester.avatar
                    ? <img src={requester.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-gray-600 font-bold">{requester.username[0].toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{requester.username}</div>
                  <div className={`text-xs flex items-center gap-1 ${getRankColorClass(requester.rank)}`}>
                    {getRankIcon(requester.rank) && <img src={getRankIcon(requester.rank)} alt="" className="w-4 h-4 object-contain" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.45))'}} />}
                    {requester.rank}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {requester.roles?.slice(0, 2).map((r) => (
                      <span key={r} className="text-xs bg-pp-input-bg text-gray-500 px-1.5 py-0.5 rounded-full border border-pp-border">
                        {getRoleIcon(r)} {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleAccept(requester._id)} className="text-xs bg-pp-orange hover:bg-pp-orange-dark text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                    Accept
                  </button>
                  <button onClick={() => handleDecline(requester._id)} className="text-xs bg-pp-input-bg hover:bg-pp-border text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-pp-border">
                    Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Connections */}
      <section>
        <h2 className="font-display font-bold text-lg text-gray-900 tracking-wide mb-4 flex items-center gap-2">
          🎮 Your Squad
        </h2>
        {connections.connections.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 mb-4">No connections yet.</p>
            <Link to="/find-duo" className="btn-primary inline-flex">Find Your First Duo</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {connections.connections.map((conn, i) => (
              <motion.div
                key={conn._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-hover p-4 cursor-pointer"
                onClick={() => navigate(`/profile/${conn.username}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-pp-input-bg border border-pp-border flex items-center justify-center overflow-hidden">
                      {conn.avatar
                        ? <img src={conn.avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-gray-600 font-bold text-sm">{conn.username[0].toUpperCase()}</span>
                      }
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 ${conn.isOnline ? 'status-online' : 'status-offline'} border-2 border-white`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{conn.username}</div>
                    <div className="text-xs text-gray-400">
                      {conn.isOnline ? '🟢 Online' : `⚫ ${formatLastSeen(conn.lastSeen)}`}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-mono font-medium flex items-center gap-1.5 ${getRankColorClass(conn.rank)}`}>
                  {getRankIcon(conn.rank)
                    ? <img src={getRankIcon(conn.rank)} alt="" className="w-5 h-5 object-contain" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.45))'}} />
                    : <span>{getRankEmoji(conn.rank)}</span>
                  }
                  {conn.rank}
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { data } = await api.post(`/chat/start/${conn._id}`);
                      navigate(`/chat/${data.conversation._id}`);
                    } catch { toast.error('Could not open conversation'); }
                  }}
                  className="mt-3 w-full text-xs btn-secondary py-1.5 rounded-xl"
                >
                  💬 Message
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: '🎮', title: 'Find Duo', desc: 'Browse players by rank & role', to: '/find-duo' },
          { icon: '✏️', title: 'Edit Profile', desc: 'Update rank, roles, and availability', to: '/profile/edit' },
          { icon: '💬', title: 'Messages', desc: 'Chat with your connected duos', to: '/chat' },
        ].map(({ icon, title, desc, to }) => (
          <Link key={to} to={to} className="card p-5 hover:border-pp-orange hover:shadow-md transition-all duration-200 hover:scale-[1.02] group">
            <div className="text-2xl mb-3">{icon}</div>
            <div className="font-display font-bold text-gray-900 text-base">{title}</div>
            <div className="text-gray-400 text-xs mt-1">{desc}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}

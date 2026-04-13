/**
 * EditProfilePage — Full profile setup including Riot ID linking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import {
  RANKS, REGIONS, ROLES, PLAYSTYLES, AGENTS,
  getRankColorClass, getRankEmoji,
} from '../utils/rankUtils';
import toast from 'react-hot-toast';

const VOICE_OPTIONS = [
  { value: 'required', label: '🎙️ Required', desc: 'Must use voice chat' },
  { value: 'preferred', label: '🎙️ Preferred', desc: 'Would like voice chat' },
  { value: 'optional', label: '🎙️ Optional', desc: 'Either is fine' },
  { value: 'never', label: '💬 Text Only', desc: 'No voice chat' },
];

export default function EditProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    bio: '',
    region: 'NA',
    roles: [],
    playstyleTags: [],
    voiceChatPreference: 'preferred',
    preferredRankMin: 'Silver 1',
    preferredRankMax: 'Gold 3',
    favoriteAgents: [],
  });

  const [riotInput, setRiotInput] = useState('');
  const [riotRank, setRiotRank] = useState('');
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [changingRiot, setChangingRiot] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate from user data
  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || '',
        region: user.region || 'NA',
        roles: user.roles || [],
        playstyleTags: user.playstyleTags || [],
        voiceChatPreference: user.voiceChatPreference || 'preferred',
        preferredRankMin: user.preferredRankMin || 'Silver 1',
        preferredRankMax: user.preferredRankMax || 'Gold 3',
        favoriteAgents: user.favoriteAgents || [],
      });
      if (user.riotId?.gameName) {
        setRiotInput(`${user.riotId.gameName}#${user.riotId.tagLine || ''}`);
      }
    }
  }, [user]);

  const toggleArray = (arr, item, setter) => {
    setter((prev) => {
      const current = prev[arr] || [];
      const updated = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [arr]: updated };
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: data.avatar });
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      toast.success('Profile updated! ✅');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkRiot = async () => {
    const parts = riotInput.trim().split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      toast.error('Enter your Riot ID in Name#TAG format (e.g. TenZ#NA1)');
      return;
    }
    if (!riotRank) {
      toast.error('Select your current rank');
      return;
    }
    setLinking(true);
    try {
      const { data } = await api.post('/riot/link', { gameName: parts[0], tagLine: parts[1], rank: riotRank });
      updateUser(data.user);
      setChangingRiot(false);
      setRiotRank('');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link Riot account');
    } finally {
      setLinking(false);
    }
  };

  const handleRefreshRank = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post('/riot/refresh');
      updateUser(data.user);
      toast.success(data.rank ? `Rank updated to ${data.rank}!` : data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh rank');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-wide">EDIT PROFILE</h1>
          <p className="text-gray-500 text-sm">Set up your player card to appear in matchmaking</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Profile Photo ─────────────────────────────────────── */}
        <section className="card p-6">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-4">
            <span>📷</span> Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-valo-dark-3 border-2 border-valo-border overflow-hidden flex items-center justify-center text-4xl font-bold text-white">
                {avatarPreview || user?.avatar
                  ? <img src={avatarPreview || (user?.avatar?.startsWith('/uploads') ? `http://localhost:5000${user.avatar}` : user.avatar)} alt="" className="w-full h-full object-cover" />
                  : user?.username?.[0]?.toUpperCase()
                }
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-valo-red border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Upload button */}
            <div className="space-y-2">
              <label className={`btn-primary text-sm px-4 py-2 cursor-pointer inline-block ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingAvatar ? 'Uploading...' : '📤 Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
              <p className="text-xs text-gray-500">JPG, PNG or GIF · Max 5MB</p>
            </div>
          </div>
        </section>

        {/* ── Riot Account ──────────────────────────────────────── */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span>🎮</span> Riot Account
          </h2>

          {user?.riotId?.gameName && !changingRiot ? (
            <div className="space-y-3">
              {/* Linked account card */}
              <div className="p-4 bg-valo-dark-2 rounded-lg border border-valo-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-mono font-bold text-white">
                        {user.riotId.gameName}<span className="text-gray-500">#{user.riotId.tagLine}</span>
                      </span>
                      {user.riotVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-valo-teal/20 border border-valo-teal/50 text-valo-teal text-xs font-semibold">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-semibold ${getRankColorClass(user.rank)}`}>
                      {getRankEmoji(user.rank)} {user.rank}
                      {user.riotVerified && <span className="text-gray-500 font-normal text-xs ml-1">(from Riot API)</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRefreshRank}
                      disabled={refreshing}
                      className="btn-secondary text-xs px-3 py-2"
                    >
                      {refreshing ? 'Updating...' : '🔄 Refresh Rank'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChangingRiot(true); setRiotInput(''); }}
                      className="text-xs px-3 py-2 rounded border border-valo-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
              {!user.riotVerified && (
                <p className="text-xs text-yellow-500/70">
                  ⚠️ Account not verified yet — rank may not reflect your actual Riot rank. Hit Refresh Rank to verify.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Enter your Riot ID to verify your account and pull your real rank directly from Riot.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="GameName#TAG  (e.g. TenZ#NA1)"
                  value={riotInput}
                  onChange={(e) => setRiotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                />
                {changingRiot && (
                  <button
                    type="button"
                    onClick={() => setChangingRiot(false)}
                    className="text-xs px-3 py-2 rounded border border-valo-border text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="input flex-1"
                  value={riotRank}
                  onChange={(e) => setRiotRank(e.target.value)}
                >
                  <option value="">— Select your current rank —</option>
                  {RANKS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleLinkRiot}
                  disabled={linking}
                  className="btn-primary whitespace-nowrap px-5"
                >
                  {linking ? 'Verifying...' : '✓ Verify Account'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                We verify your Riot ID is real, then save the rank you select. Find your Riot ID in the Valorant client top-right corner.
              </p>
            </div>
          )}

          {/* Region */}
          <div>
            <label className="input-label">Server / Region</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, region: r })}
                  className={`px-4 py-2 rounded border text-sm font-display font-semibold tracking-wide transition-all ${
                    form.region === r
                      ? 'bg-valo-red/20 border-valo-red text-valo-red'
                      : 'border-valo-border text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bio ───────────────────────────────────────────────── */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span>✍️</span> About You
          </h2>
          <div>
            <label className="input-label">Bio <span className="text-gray-600 normal-case tracking-normal font-normal">(max 300 chars)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              maxLength={300}
              placeholder="Describe your playstyle, what you're looking for in a duo..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="text-right text-xs text-gray-600 mt-1">{form.bio.length}/300</div>
          </div>
        </section>

        {/* ── Roles ─────────────────────────────────────────────── */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span>🛡️</span> Roles & Playstyle
          </h2>

          <div>
            <label className="input-label">Your Roles <span className="text-gray-600 normal-case font-normal tracking-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleArray('roles', role, setForm)}
                  className={`px-4 py-2 rounded border text-sm font-display font-semibold tracking-wide transition-all ${
                    form.roles.includes(role)
                      ? 'bg-valo-red/20 border-valo-red text-valo-red'
                      : 'border-valo-border text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Playstyle Tags</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLAYSTYLES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleArray('playstyleTags', tag, setForm)}
                  className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                    form.playstyleTags.includes(tag)
                      ? 'bg-valo-teal/20 border-valo-teal text-valo-teal'
                      : 'border-valo-border text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Voice Chat Preference</label>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {VOICE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, voiceChatPreference: value })}
                  className={`p-3 rounded border text-left transition-all ${
                    form.voiceChatPreference === value
                      ? 'bg-valo-red/10 border-valo-red'
                      : 'border-valo-border hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Preferred Rank Range ───────────────────────────────── */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span>🏆</span> Duo Preferences
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Minimum Rank</label>
              <select
                className="input"
                value={form.preferredRankMin}
                onChange={(e) => setForm({ ...form, preferredRankMin: e.target.value })}
              >
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Maximum Rank</label>
              <select
                className="input"
                value={form.preferredRankMax}
                onChange={(e) => setForm({ ...form, preferredRankMax: e.target.value })}
              >
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            You'll still appear in all searches — this just sets your preference shown on your card.
          </p>
        </section>

        {/* ── Favorite Agents ────────────────────────────────────── */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span>🦸</span> Favorite Agents
            <span className="text-xs text-gray-500 font-body font-normal tracking-normal normal-case">(pick up to 5)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {AGENTS.map((agent) => (
              <button
                key={agent}
                type="button"
                disabled={!form.favoriteAgents.includes(agent) && form.favoriteAgents.length >= 5}
                onClick={() => toggleArray('favoriteAgents', agent, setForm)}
                className={`px-3 py-1.5 rounded border text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  form.favoriteAgents.includes(agent)
                    ? 'bg-valo-gold/20 border-valo-gold text-valo-gold'
                    : 'border-valo-border text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {agent}
              </button>
            ))}
          </div>
        </section>

        {/* ── Save button ────────────────────────────────────────── */}
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-8">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

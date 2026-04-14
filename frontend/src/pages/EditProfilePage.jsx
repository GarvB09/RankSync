/**
 * EditProfilePage — Full profile setup including Riot ID linking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import api, { API_URL } from '../utils/api';
import { RANKS, REGIONS, ROLES, PLAYSTYLES, AGENTS, getRankColorClass, getRankEmoji, getAgentIcon } from '../utils/rankUtils';
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
    bio: '', age: '', gender: '', region: '', city: '',
    roles: [], playstyleTags: [], voiceChatPreference: 'preferred',
    preferredRankMin: 'Silver 1', preferredRankMax: 'Gold 3', favoriteAgents: [],
  });

  const [newUsername, setNewUsername] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [riotInput, setRiotInput] = useState('');
  const [riotRank, setRiotRank] = useState('');
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [changingRiot, setChangingRiot] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || '', age: user.age || '', gender: user.gender || '',
        region: user.region || '', city: user.city || '',
        roles: user.roles || [], playstyleTags: user.playstyleTags || [],
        voiceChatPreference: user.voiceChatPreference || 'preferred',
        preferredRankMin: user.preferredRankMin || 'Silver 1',
        preferredRankMax: user.preferredRankMax || 'Gold 3',
        favoriteAgents: user.favoriteAgents || [],
      });
      if (user.riotId?.gameName) setRiotInput(`${user.riotId.gameName}#${user.riotId.tagLine || ''}`);
    }
  }, [user]);

  const toggleArray = (arr, item, setter) => {
    setter((prev) => {
      const current = prev[arr] || [];
      const updated = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [arr]: updated };
    });
  };

  // Crop to square, resize to 600×600, export as high-quality JPEG
  const processAvatar = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const SIZE = 600;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        // Center-crop the shortest dimension to a square
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setUploadingAvatar(true);
    try {
      const base64 = await processAvatar(file);
      setAvatarPreview(base64);
      const { data } = await api.post('/users/avatar', { avatar: base64 });
      updateUser({ avatar: data.avatar });
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
      setAvatarPreview(null);
    } finally { setUploadingAvatar(false); }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;
    setSavingUsername(true);
    try {
      const { data } = await api.put('/users/username', { username: newUsername.trim() });
      updateUser(data.user);
      setChangingUsername(false);
      setNewUsername('');
      toast.success('Username updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update username');
    } finally { setSavingUsername(false); }
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
    } finally { setSaving(false); }
  };

  const handleLinkRiot = async () => {
    const parts = riotInput.trim().split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) { toast.error('Enter Riot ID as Name#TAG'); return; }
    if (!riotRank) { toast.error('Select your current rank'); return; }
    setLinking(true);
    try {
      const { data } = await api.post('/riot/link', { gameName: parts[0], tagLine: parts[1], rank: riotRank });
      updateUser(data.user);
      setChangingRiot(false);
      setRiotRank('');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link Riot account');
    } finally { setLinking(false); }
  };

  const handleRefreshRank = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post('/riot/refresh');
      updateUser(data.user);
      toast.success(data.rank ? `Rank updated to ${data.rank}!` : data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh rank');
    } finally { setRefreshing(false); }
  };

  const SectionHeader = ({ icon, title }) => (
    <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-900 transition-colors">← Back</button>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-wide">EDIT PROFILE</h1>
          <p className="text-gray-500 text-sm">Set up your player card to appear in matchmaking</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Username */}
        <section className="card p-6 space-y-4">
          <SectionHeader icon="👤" title="Username" />
          {!changingUsername ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-gray-900 text-base">@{user?.username}</div>
                <div className="text-xs text-gray-400 mt-0.5">Your public display name</div>
              </div>
              <button type="button" onClick={() => setChangingUsername(true)} className="btn-secondary text-xs px-4 py-2">Change</button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text" className="input"
                placeholder="New username (3–20 chars, letters/numbers/_)"
                value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} maxLength={20}
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleUsernameChange} disabled={savingUsername || !newUsername.trim()} className="btn-primary text-xs px-5 py-2 disabled:opacity-40">
                  {savingUsername ? 'Saving...' : 'Save Username'}
                </button>
                <button type="button" onClick={() => { setChangingUsername(false); setNewUsername(''); }} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              </div>
            </div>
          )}
        </section>

        {/* Profile Photo */}
        <section className="card p-6">
          <SectionHeader icon="📷" title="Profile Photo" />
          <div className="flex items-center gap-6 mt-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-pp-input-bg border-2 border-pp-border overflow-hidden flex items-center justify-center">
                {avatarPreview || user?.avatar
                  ? <img src={avatarPreview || (user?.avatar?.startsWith('/uploads') ? `${API_URL}${user.avatar}` : user.avatar)} alt="" className="w-full h-full object-cover" />
                  : <span className="text-gray-500 text-4xl font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-pp-orange border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className={`btn-primary text-sm px-4 py-2 cursor-pointer inline-block ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingAvatar ? 'Uploading...' : '📤 Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              <p className="text-xs text-gray-400">JPG, PNG or GIF · Max 5MB</p>
            </div>
          </div>
        </section>

        {/* Riot Account */}
        <section className="card p-6 space-y-4">
          <SectionHeader icon="🎮" title="Riot Account" />

          {user?.riotId?.gameName && !changingRiot ? (
            <div className="space-y-3">
              <div className="p-4 bg-pp-input-bg rounded-xl border border-pp-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-mono font-bold text-gray-900">
                        {user.riotId.gameName}<span className="text-gray-400">#{user.riotId.tagLine}</span>
                      </span>
                      {user.riotVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-semibold">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-semibold ${getRankColorClass(user.rank)}`}>
                      {getRankEmoji(user.rank)} {user.rank}
                      {user.riotVerified && <span className="text-gray-400 font-normal text-xs ml-1">(from Riot API)</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={handleRefreshRank} disabled={refreshing} className="btn-secondary text-xs px-3 py-2">
                      {refreshing ? 'Updating...' : '🔄 Refresh Rank'}
                    </button>
                    <button type="button" onClick={() => { setChangingRiot(true); setRiotInput(''); }} className="btn-secondary text-xs px-3 py-2">
                      Change
                    </button>
                  </div>
                </div>
              </div>
              {!user.riotVerified && (
                <p className="text-xs text-amber-600">⚠️ Account not verified yet. Hit Refresh Rank to verify.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Enter your Riot ID to verify your account and pull your real rank.</p>
              <div className="flex gap-2">
                <input type="text" className="input flex-1" placeholder="GameName#TAG (e.g. TenZ#NA1)"
                  value={riotInput} onChange={(e) => setRiotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                {changingRiot && (
                  <button type="button" onClick={() => setChangingRiot(false)} className="btn-secondary text-xs px-3 py-2">Cancel</button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <select className="input flex-1" value={riotRank} onChange={(e) => setRiotRank(e.target.value)}>
                  <option value="">— Select your current rank —</option>
                  {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="button" onClick={handleLinkRiot} disabled={linking} className="btn-primary whitespace-nowrap px-5">
                  {linking ? 'Verifying...' : '✓ Verify Account'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Find your Riot ID in the Valorant client top-right corner.</p>
            </div>
          )}

          {/* State + City */}
          <div className="space-y-3 pt-2 border-t border-pp-border">
            <div>
              <label className="input-label">State</label>
              <div className="flex gap-3 flex-wrap items-center">
                <select className="input flex-1 max-w-xs" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                  <option value="">— Select your state —</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-pp-border bg-pp-input-bg opacity-50 cursor-not-allowed select-none">
                  <span className="text-xs text-gray-400">🌐 Cross Region</span>
                  <span className="text-xs text-pp-orange font-semibold">Coming Soon</span>
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">City <span className="text-gray-400 normal-case tracking-normal font-normal">(optional)</span></label>
              <input type="text" className="input max-w-xs" placeholder="e.g. Mumbai, Bengaluru..."
                maxLength={50} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
        </section>

        {/* About You */}
        <section className="card p-6 space-y-4">
          <SectionHeader icon="✍️" title="About You" />
          <div className="flex gap-8 flex-wrap">
            <div>
              <label className="input-label">Age</label>
              <input type="number" min="18" max="60" className="input w-28" placeholder="e.g. 21"
                value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Gender</label>
              <div className="flex gap-2 mt-1.5">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })}
                    className={`px-4 py-2 rounded-xl border text-sm font-display font-semibold tracking-wide transition-all ${
                      form.gender === g ? 'bg-pp-orange-light border-pp-orange text-pp-orange' : 'border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="input-label">Bio <span className="text-gray-400 normal-case tracking-normal font-normal">(max 300 chars)</span></label>
            <textarea className="input resize-none" rows={3} maxLength={300}
              placeholder="Describe your playstyle, what you're looking for in a duo..."
              value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <div className="text-right text-xs text-gray-400 mt-1">{form.bio.length}/300</div>
          </div>
        </section>

        {/* Roles & Playstyle */}
        <section className="card p-6 space-y-4">
          <SectionHeader icon="🛡️" title="Roles & Playstyle" />

          <div>
            <label className="input-label">Your Roles <span className="text-gray-400 normal-case font-normal tracking-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleArray('roles', role, setForm)}
                  className={`px-4 py-2 rounded-xl border text-sm font-display font-semibold tracking-wide transition-all ${
                    form.roles.includes(role) ? 'bg-pp-orange-light border-pp-orange text-pp-orange' : 'border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
                  }`}>
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Playstyle Tags</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLAYSTYLES.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleArray('playstyleTags', tag, setForm)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    form.playstyleTags.includes(tag) ? 'bg-pp-orange border-pp-orange text-white' : 'border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Voice Chat Preference</label>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {VOICE_OPTIONS.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => setForm({ ...form, voiceChatPreference: value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.voiceChatPreference === value ? 'bg-pp-orange-light border-pp-orange' : 'border-pp-border hover:border-pp-orange'
                  }`}>
                  <div className="text-sm font-semibold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Duo Preferences */}
        <section className="card p-6 space-y-4">
          <SectionHeader icon="🏆" title="Duo Preferences" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Minimum Rank</label>
              <select className="input" value={form.preferredRankMin} onChange={(e) => setForm({ ...form, preferredRankMin: e.target.value })}>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Maximum Rank</label>
              <select className="input" value={form.preferredRankMax} onChange={(e) => setForm({ ...form, preferredRankMax: e.target.value })}>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">You'll still appear in all searches — this just shows your preference on your card.</p>
        </section>

        {/* Favorite Agents */}
        <section className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <span>🦸</span> Favorite Agents
            <span className="text-xs text-gray-400 font-body font-normal tracking-normal normal-case">(pick up to 5)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {AGENTS.map((agent) => {
              const icon = getAgentIcon(agent);
              const selected = form.favoriteAgents.includes(agent);
              return (
                <button key={agent} type="button"
                  disabled={!selected && form.favoriteAgents.length >= 5}
                  onClick={() => toggleArray('favoriteAgents', agent, setForm)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-pp-border text-gray-500 hover:border-pp-orange hover:text-pp-orange'
                  }`}>
                  {icon
                    ? <img src={icon} alt="" className="w-4 h-4 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    : null
                  }
                  {agent}
                </button>
              );
            })}
          </div>
        </section>

        {/* Save */}
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-8">Cancel</button>
        </div>
      </form>
    </div>
  );
}

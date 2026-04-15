/**
 * Valorant rank utilities
 */

export const RANKS = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant',
];

export const RANK_TIERS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];

// Asia-Pacific regions (Valorant AP server countries)
export const REGIONS = [
  'India', 'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan',
  'Thailand', 'Indonesia', 'Malaysia', 'Philippines', 'Vietnam',
  'Australia', 'New Zealand', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka',
];

// ISO 3166-1 alpha-2 codes for flagcdn.com PNG flags
const REGION_CODES = {
  'India': 'in', 'Japan': 'jp', 'South Korea': 'kr',
  'Singapore': 'sg', 'Hong Kong': 'hk', 'Taiwan': 'tw',
  'Thailand': 'th', 'Indonesia': 'id', 'Malaysia': 'my',
  'Philippines': 'ph', 'Vietnam': 'vn', 'Australia': 'au',
  'New Zealand': 'nz', 'Pakistan': 'pk', 'Bangladesh': 'bd',
  'Nepal': 'np', 'Sri Lanka': 'lk',
};

/**
 * Returns a PNG flag image URL from flagcdn.com.
 * Usage: <img src={getRegionFlagUrl('India')} className="w-5 h-4 object-cover rounded-sm" />
 */
export const getRegionFlagUrl = (region) => {
  const code = REGION_CODES[region];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

// Keep emoji map for <select> options (HTML options can't render images)
export const REGION_FLAGS = {
  'India': '🇮🇳', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
  'Singapore': '🇸🇬', 'Hong Kong': '🇭🇰', 'Taiwan': '🇹🇼',
  'Thailand': '🇹🇭', 'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭', 'Vietnam': '🇻🇳', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩',
  'Nepal': '🇳🇵', 'Sri Lanka': '🇱🇰',
};

export const ROLES = ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'Flex'];

export const PLAYSTYLES = ['Competitive', 'Casual', 'Aggressive', 'Chill', 'Tactical', 'IGL'];

export const VOICE_PREFS = [
  { value: 'required', label: 'Voice Required' },
  { value: 'preferred', label: 'Voice Preferred' },
  { value: 'optional', label: 'Voice Optional' },
  { value: 'never', label: 'Text Only' },
];

export const AGENTS = [
  'Brimstone', 'Viper', 'Omen', 'Killjoy', 'Cypher', 'Sova', 'Sage',
  'Phoenix', 'Jett', 'Reyna', 'Raze', 'Breach', 'Skye', 'Yoru', 'Astra',
  'KAY/O', 'Chamber', 'Neon', 'Fade', 'Harbor', 'Gekko', 'Deadlock', 'Iso',
  'Clove', 'Vyse', 'Tejo', 'Waylay',
];

// Valorant agent portrait icons from valorant-api.com (community CDN)
const CDN = 'https://media.valorant-api.com/agents';
const AGENT_UUIDS = {
  'Brimstone': '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  'Viper':     '707eab51-4836-f488-046a-cda6bf494859',
  'Omen':      '8e253930-4c05-31dd-1b6c-968525494517',
  'Killjoy':   '1e58de9c-4950-5125-93e9-a0aee9f98746',
  'Cypher':    '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  'Sova':      '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  'Sage':      '569fdd95-4d10-43ab-ca70-79becc718b46',
  'Phoenix':   'eb93336a-449b-9c1b-0a54-a891f7921d69',
  'Jett':      'add6443a-41bd-e414-f6ad-e58d267f4e95',
  'Reyna':     'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  'Raze':      'f94c3b30-42be-e959-889c-5aa313dba261',
  'Breach':    '5f8d3a7f-467b-97f3-062c-13acf203c006',
  'Skye':      '6f2a04ca-43e0-be17-7f36-b3908627744d',
  'Yoru':      '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
  'Astra':     '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  'KAY/O':     '601dbbe7-43ce-be57-2a40-4abd24953621',
  'Chamber':   '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
  'Neon':      'bb2a4828-46eb-8cd1-e765-15848195d751',
  'Fade':      'dade69b4-4f5a-8528-247b-219e5a1facd6',
  'Harbor':    '95b78ed7-4637-86d9-7e41-71ba8c293152',
  'Gekko':     'e370fa57-4757-3604-3648-499e1f642d3f',
  'Deadlock':  'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
  'Iso':       '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
  'Clove':     '1dbf2edd-4729-0984-3115-daa5eed44993',
  'Vyse':      'efba5359-4016-a1e5-7626-b1ae76895940',
  'Tejo':      'b444168c-4e35-8076-db47-ef9bf368f384',
  'Waylay':    'df1cb487-4902-002e-5c17-d28e83e78588',
};

/**
 * Returns the portrait icon URL for a Valorant agent, or null if unknown.
 * Usage: <img src={getAgentIcon('Jett')} onError={e => e.target.style.display='none'} />
 */
export const getAgentIcon = (name) => {
  const uuid = AGENT_UUIDS[name];
  return uuid ? `${CDN}/${uuid}/displayicon.png` : null;
};

/**
 * Returns the official Valorant rank icon URL from the valorant-api.com CDN.
 * Tiers 3–27 map 1-to-1 with the RANKS array (Iron 1 → Radiant).
 * Usage: <img src={getRankIcon('Diamond 2')} className="w-6 h-6" />
 */
const RANK_TIER_CDN = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04';
export const getRankIcon = (rank) => {
  const index = RANKS.indexOf(rank);
  return index !== -1 ? `${RANK_TIER_CDN}/${index + 3}/largeicon.png` : null;
};

/**
 * Get the tier name from a full rank string (e.g. "Diamond 2" → "Diamond")
 */
export const getRankTier = (rank) => rank?.split(' ')[0] || '';

/**
 * Get CSS class for rank coloring
 */
export const getRankColorClass = (rank) => {
  const tier = getRankTier(rank)?.toLowerCase();
  const map = {
    iron: 'text-gray-400',
    bronze: 'text-amber-600',
    silver: 'text-gray-300',
    gold: 'text-yellow-400',
    platinum: 'text-teal-400',
    diamond: 'text-blue-400',
    ascendant: 'text-purple-400',
    immortal: 'text-valo-red',
    radiant: 'text-yellow-300',
  };
  return map[tier] || 'text-gray-300';
};

/**
 * Get rank icon emoji
 */
export const getRankEmoji = (rank) => {
  const tier = getRankTier(rank)?.toLowerCase();
  const map = {
    iron: '⚙️', bronze: '🥉', silver: '🥈', gold: '🥇',
    platinum: '💎', diamond: '💠', ascendant: '🔮', immortal: '⚡', radiant: '🌟',
  };
  return map[tier] || '🎮';
};

/**
 * Get role icon
 */
export const getRoleIcon = (role) => {
  const map = {
    Duelist: '⚔️', Controller: '🌫️', Initiator: '🔍', Sentinel: '🛡️', Flex: '🔄',
  };
  return map[role] || '🎮';
};

/**
 * Format last seen timestamp
 */
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Unknown';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

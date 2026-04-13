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

export const REGIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Chandigarh', 'Puducherry',
];

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

/**
 * Database Seeder
 * Populates DB with realistic mock Valorant players for development/demo
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MOCK_PLAYERS = [
  {
    username: 'NightSentinel',
    email: 'sentinel@demo.com',
    password: 'password123',
    rank: 'Diamond 2',
    region: 'NA',
    roles: ['Sentinel', 'Controller'],
    playstyleTags: ['Competitive', 'Tactical'],
    voiceChatPreference: 'required',
    bio: 'Main Killjoy / Viper. IGL experience. Looking for serious ranked partners D1+',
    preferredRankMin: 'Diamond 1',
    preferredRankMax: 'Immortal 3',
    favoriteAgents: ['Killjoy', 'Viper', 'Sage'],
    riotId: { gameName: 'NightSentinel', tagLine: 'NA1' },
    isProfileComplete: true,
  },
  {
    username: 'VoidDuelist',
    email: 'duelist@demo.com',
    password: 'password123',
    rank: 'Immortal 1',
    region: 'NA',
    roles: ['Duelist'],
    playstyleTags: ['Aggressive', 'Competitive'],
    voiceChatPreference: 'preferred',
    bio: 'Jett/Reyna main. Entry fragger. Top 500 last act. Let\'s hit Radiant.',
    preferredRankMin: 'Diamond 3',
    preferredRankMax: 'Radiant',
    favoriteAgents: ['Jett', 'Reyna', 'Neon'],
    riotId: { gameName: 'VoidDuelist', tagLine: 'NA1' },
    isProfileComplete: true,
  },
  {
    username: 'ChillController',
    email: 'controller@demo.com',
    password: 'password123',
    rank: 'Gold 3',
    region: 'EU',
    roles: ['Controller', 'Initiator'],
    playstyleTags: ['Chill', 'Casual'],
    voiceChatPreference: 'optional',
    bio: 'Omen main. Play for fun but love winning. EU evenings. ',
    preferredRankMin: 'Silver 3',
    preferredRankMax: 'Platinum 2',
    favoriteAgents: ['Omen', 'Astra', 'Breach'],
    riotId: { gameName: 'ChillController', tagLine: 'EUW' },
    isProfileComplete: true,
  },
  {
    username: 'ApexInitiator',
    email: 'initiator@demo.com',
    password: 'password123',
    rank: 'Platinum 3',
    region: 'AP',
    roles: ['Initiator', 'Flex'],
    playstyleTags: ['Tactical', 'Competitive'],
    voiceChatPreference: 'preferred',
    bio: 'Sova/Fade main. Love setting up kills for the team. AP server based.',
    preferredRankMin: 'Platinum 1',
    preferredRankMax: 'Diamond 2',
    favoriteAgents: ['Sova', 'Fade', 'KAY/O'],
    riotId: { gameName: 'ApexInitiator', tagLine: 'AP1' },
    isProfileComplete: true,
  },
  {
    username: 'RadiantHunter',
    email: 'radiant@demo.com',
    password: 'password123',
    rank: 'Ascendant 3',
    region: 'NA',
    roles: ['Duelist', 'Initiator'],
    playstyleTags: ['Competitive', 'Aggressive'],
    voiceChatPreference: 'required',
    bio: 'Peaked Radiant last act. Grinding back up. Main Raze and Skye.',
    preferredRankMin: 'Ascendant 1',
    preferredRankMax: 'Radiant',
    favoriteAgents: ['Raze', 'Skye', 'Yoru'],
    riotId: { gameName: 'RadiantHunter', tagLine: 'NA1' },
    isProfileComplete: true,
  },
  {
    username: 'SilverFlash',
    email: 'silver@demo.com',
    password: 'password123',
    rank: 'Silver 2',
    region: 'NA',
    roles: ['Flex', 'Duelist'],
    playstyleTags: ['Casual', 'Chill'],
    voiceChatPreference: 'optional',
    bio: 'Still learning the game! Happy to play with patient teammates. Fun > wins',
    preferredRankMin: 'Iron 1',
    preferredRankMax: 'Gold 1',
    favoriteAgents: ['Phoenix', 'Sage'],
    riotId: { gameName: 'SilverFlash', tagLine: 'NA2' },
    isProfileComplete: true,
  },
  {
    username: 'EUFragger',
    email: 'eufragger@demo.com',
    password: 'password123',
    rank: 'Diamond 1',
    region: 'EU',
    roles: ['Duelist', 'Controller'],
    playstyleTags: ['Competitive', 'Tactical'],
    voiceChatPreference: 'required',
    bio: 'EU Diamond looking for a consistent duo. Speak English/German. Discord required.',
    preferredRankMin: 'Platinum 3',
    preferredRankMax: 'Immortal 2',
    favoriteAgents: ['Chamber', 'Jett', 'Viper'],
    riotId: { gameName: 'EUFragger', tagLine: 'EU1' },
    isProfileComplete: true,
  },
  {
    username: 'KRProdigy',
    email: 'kr@demo.com',
    password: 'password123',
    rank: 'Immortal 3',
    region: 'KR',
    roles: ['Duelist', 'Initiator'],
    playstyleTags: ['Competitive', 'Aggressive'],
    voiceChatPreference: 'preferred',
    bio: 'KR server Immortal. Fast-paced aggressive style. Looking for Immortal+ partners.',
    preferredRankMin: 'Immortal 1',
    preferredRankMax: 'Radiant',
    favoriteAgents: ['Neon', 'Raze', 'Breach'],
    riotId: { gameName: 'KRProdigy', tagLine: 'KR1' },
    isProfileComplete: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/find-your-duo');
    console.log('✅ Connected to MongoDB');

    // Clear existing mock users (only demo accounts)
    await User.deleteMany({ email: { $regex: '@demo.com$' } });
    console.log('🧹 Cleared existing seed data');

    // Insert mock players
    const created = await User.create(MOCK_PLAYERS);
    console.log(`🌱 Seeded ${created.length} players:`);
    created.forEach((u) => console.log(`   • ${u.username} (${u.rank}, ${u.region})`));

    console.log('\n✅ Database seeded successfully!');
    console.log('🔑 All demo accounts use password: password123\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

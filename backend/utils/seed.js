/**
 * Database Seeder
 * Populates DB with guest demo accounts for public access
 * Run with: npm run seed
 *
 * Guest credentials (shareable):
 *   guest1@playpair.com / guest1234
 *   guest2@playpair.com / guest1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MOCK_PLAYERS = [
  {
    username: 'GuestPlayer1',
    email: 'guest1@playpair.com',
    password: 'guest1234',
    gender: 'Male',
    age: 21,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=GuestPlayer1&backgroundColor=ff6b00&scale=110',
    rank: 'Diamond 2',
    region: 'Maharashtra',
    city: 'Mumbai',
    roles: ['Duelist', 'Initiator'],
    playstyleTags: ['Competitive', 'Aggressive'],
    voiceChatPreference: 'preferred',
    bio: 'Guest demo account. Jett/Raze main, looking for a duo to push Immortal.',
    preferredRankMin: 'Diamond 1',
    preferredRankMax: 'Immortal 3',
    favoriteAgents: ['Jett', 'Raze', 'Neon'],
    riotId: { gameName: 'GuestPlayer1', tagLine: 'IN1' },
    isProfileComplete: true,
  },
  {
    username: 'GuestPlayer2',
    email: 'guest2@playpair.com',
    password: 'guest1234',
    gender: 'Female',
    age: 20,
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=GuestPlayer2&backgroundColor=ff6b00&scale=110',
    rank: 'Platinum 3',
    region: 'Karnataka',
    city: 'Bengaluru',
    roles: ['Controller', 'Sentinel'],
    playstyleTags: ['Tactical', 'Competitive'],
    voiceChatPreference: 'preferred',
    bio: 'Guest demo account. Viper/Killjoy main, love setting up post-plants and locking down sites.',
    preferredRankMin: 'Gold 3',
    preferredRankMax: 'Diamond 2',
    favoriteAgents: ['Viper', 'Killjoy', 'Cypher'],
    riotId: { gameName: 'GuestPlayer2', tagLine: 'IN1' },
    isProfileComplete: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/find-your-duo');
    console.log('✅ Connected to MongoDB');

    // Remove all old demo accounts (both @demo.com and @playpair.com)
    await User.deleteMany({ email: { $regex: '@demo\\.com$' } });
    await User.deleteMany({ email: { $regex: '@playpair\\.com$' } });
    console.log('🧹 Cleared existing seed data');

    const created = await User.create(MOCK_PLAYERS);
    console.log(`🌱 Seeded ${created.length} guest accounts:`);
    created.forEach((u) => console.log(`   • ${u.username} — ${u.email} / guest1234`));

    console.log('\n✅ Done! Share these credentials for guest access:');
    console.log('   📧 guest1@playpair.com  🔑 guest1234');
    console.log('   📧 guest2@playpair.com  🔑 guest1234\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

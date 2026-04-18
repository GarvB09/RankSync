/**
 * One-time migration: mark profiles complete for users who have
 * rank + region + roles (Valorant) or lolRank + lolRegion + lolLanes (LoL)
 * but isProfileComplete is still false.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Fix Valorant users
  const valoResult = await User.updateMany(
    {
      isProfileComplete: false,
      game: { $in: ['valorant', null] },
      rank: { $exists: true, $ne: null },
      region: { $exists: true, $ne: null },
      'roles.0': { $exists: true },
    },
    { $set: { isProfileComplete: true } }
  );
  console.log(`Valorant profiles fixed: ${valoResult.modifiedCount}`);

  // Fix LoL users
  const lolResult = await User.updateMany(
    {
      isProfileComplete: false,
      game: 'lol',
      lolRank: { $exists: true, $ne: null },
      lolRegion: { $exists: true, $ne: null },
      'lolLanes.0': { $exists: true },
    },
    { $set: { isProfileComplete: true } }
  );
  console.log(`LoL profiles fixed: ${lolResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });

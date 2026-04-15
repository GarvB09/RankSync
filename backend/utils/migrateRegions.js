/**
 * One-time migration: update all users with old Indian state regions → "India"
 * Run with: node backend/utils/migrateRegions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const OLD_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Chandigarh', 'Puducherry',
];

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/find-your-duo');
    console.log('✅ Connected to MongoDB');

    const result = await User.updateMany(
      { region: { $in: OLD_INDIAN_STATES } },
      { $set: { region: 'India' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users from Indian states → India`);
    console.log(`   (${result.matchedCount} matched, ${result.modifiedCount} changed)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
};

migrate();

/**
 * MongoDB connection configuration
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/find-your-duo',
      {
        maxPoolSize: 10,              // Max concurrent DB connections
        minPoolSize: 2,               // Keep 2 warm to reduce cold-start latency
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,  // Detect dead connections faster
        retryWrites: true,
        retryReads: true,
      }
    );
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — will auto-reconnect');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

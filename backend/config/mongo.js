const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || '';

let connection = null;

const connect = async () => {
  if (!MONGO_URI) {
    console.log('⚠️  No MONGO_URI set, skipping MongoDB connection.');
    return false;
  }

  if (connection) return true;

  try {
    await mongoose.connect(MONGO_URI);
    connection = mongoose.connection;
    console.log('✅ MongoDB connected successfully.');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    return false;
  }
};

module.exports = {
  connect,
  mongoose,
};

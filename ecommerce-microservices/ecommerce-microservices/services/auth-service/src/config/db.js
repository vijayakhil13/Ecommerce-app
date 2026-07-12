const mongoose = require('mongoose');

let connectionState = { connected: false, error: null };

async function connectDB() {
  try {
    await mongoose.connect(process.env.AUTH_MONGO_URI || 'mongodb://mongo:27017/auth_db');
    connectionState = { connected: true, error: null };
    console.log('[auth-service] MongoDB connected');
  } catch (err) {
    connectionState = { connected: false, error: err.message };
    console.error('[auth-service] MongoDB connection error:', err.message);
    setTimeout(connectDB, 5000); // retry
  }
}

function getDbInfo() {
  return {
    dbName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    readyState: mongoose.connection.readyState, // 0=disconnected,1=connected,2=connecting,3=disconnecting
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    ...connectionState,
  };
}

module.exports = { connectDB, getDbInfo };

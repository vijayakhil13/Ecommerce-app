const mongoose = require('mongoose');
let connectionState = { connected: false, error: null };

async function connectDB() {
  try {
    await mongoose.connect(process.env.PAYMENT_MONGO_URI || 'mongodb://mongo:27017/payment_db');
    connectionState = { connected: true, error: null };
    console.log('[payment-service] MongoDB connected');
  } catch (err) {
    connectionState = { connected: false, error: err.message };
    console.error('[payment-service] MongoDB connection error:', err.message);
    setTimeout(connectDB, 5000);
  }
}

function getDbInfo() {
  return {
    dbName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    readyState: mongoose.connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    ...connectionState,
  };
}

module.exports = { connectDB, getDbInfo };

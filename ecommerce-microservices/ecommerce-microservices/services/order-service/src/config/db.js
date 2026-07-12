const mongoose = require('mongoose');
let connectionState = { connected: false, error: null };

async function connectDB() {
  try {
    await mongoose.connect(process.env.ORDER_MONGO_URI || 'mongodb://mongo:27017/order_db');
    connectionState = { connected: true, error: null };
    console.log('[order-service] MongoDB connected');
  } catch (err) {
    connectionState = { connected: false, error: err.message };
    console.error('[order-service] MongoDB connection error:', err.message);
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

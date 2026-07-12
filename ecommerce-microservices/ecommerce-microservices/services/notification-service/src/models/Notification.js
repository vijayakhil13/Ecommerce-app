const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    orderId: { type: String, index: true },
    channel: { type: String, enum: ['email', 'sms', 'push'], default: 'email' },
    type: { type: String, required: true }, // e.g. ORDER_CONFIRMED, PAYMENT_FAILED
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

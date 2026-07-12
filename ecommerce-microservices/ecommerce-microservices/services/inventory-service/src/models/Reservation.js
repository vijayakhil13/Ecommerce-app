const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    items: [
      {
        productId: String,
        quantity: Number,
      },
    ],
    status: { type: String, enum: ['RESERVED', 'FAILED', 'RELEASED'], default: 'RESERVED' },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);

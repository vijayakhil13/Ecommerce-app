const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    line1: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true }, // maps to auth-service User._id
    name: String,
    email: String,
    phone: String,
    avatarUrl: String,
    addresses: [addressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);

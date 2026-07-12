const express = require('express');
const Reservation = require('../models/Reservation');
const router = express.Router();

// list reservations for an order (used for debugging / admin dashboard)
router.get('/order/:orderId', async (req, res) => {
  const reservations = await Reservation.find({ orderId: req.params.orderId });
  res.json({ reservations });
});

module.exports = router;

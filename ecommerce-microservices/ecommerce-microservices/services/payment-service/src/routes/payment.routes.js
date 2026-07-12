const express = require('express');
const Payment = require('../models/Payment');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

// list my payments
router.get('/my-payments', authenticate, async (req, res) => {
  const payments = await Payment.find({ userId: req.user.id }).sort('-createdAt');
  res.json({ payments });
});

router.get('/order/:orderId', authenticate, async (req, res) => {
  const payment = await Payment.findOne({ orderId: req.params.orderId });
  res.json({ payment });
});

module.exports = router;

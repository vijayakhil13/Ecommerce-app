const express = require('express');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/authMiddleware');
const { publishOrderCreated, publishOrderCancelled } = require('../kafka/kafka');

const router = express.Router();

// ---------- CREATE ORDER (kicks off the event-driven saga) ----------
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'Order must contain items' });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      status: 'PENDING',
    });

    // publish order.created -> inventory-service & payment-service react asynchronously via Kafka
    await publishOrderCreated(order);

    res.status(201).json({ message: 'Order created, processing asynchronously', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
});

// ---------- INTERNAL: service-to-service lookup (no user auth, called only within the docker network) ----------
router.get('/internal/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ order });
});

// ---------- LIST MY ORDERS ----------
router.get('/my-orders', authenticate, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort('-createdAt');
  res.json({ orders });
});

// ---------- GET ORDER STATUS (polled by frontend to show live saga progress) ----------
router.get('/:id', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ order });
});

// ---------- CANCEL ORDER ----------
router.post('/:id/cancel', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  order.status = 'CANCELLED';
  await order.save();
  await publishOrderCancelled(order);
  res.json({ order });
});

module.exports = router;

const express = require('express');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ---------- PUBLIC: list / search catalog ----------
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: q };

    const products = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Product.countDocuments(filter);

    res.json({ total, page: Number(page), limit: Number(limit), products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

// ---------- PUBLIC: get categories ----------
router.get('/categories', async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json({ categories });
});

// ---------- PUBLIC: get single product ----------
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

// ---------- PROTECTED: create product (seller/admin) ----------
router.post('/', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, sellerId: req.user.id });
    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
});

// ---------- PROTECTED: update product ----------
router.put('/:id', authenticate, authorize('seller', 'admin'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.sellerId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Not your product' });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json({ product });
});

// ---------- PROTECTED: delete product ----------
router.delete('/:id', authenticate, authorize('seller', 'admin'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.sellerId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Not your product' });
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});

// ---------- INTERNAL: used by order/inventory services to decrement stock ----------
router.patch('/:id/stock', async (req, res) => {
  const { delta } = req.body; // negative to decrement
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.stock = Math.max(0, product.stock + Number(delta));
  await product.save();
  res.json({ product });
});

module.exports = router;

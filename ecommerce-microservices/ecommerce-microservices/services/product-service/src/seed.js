/**
 * Run inside the product-service container (or locally with PRODUCT_MONGO_URI set)
 * to seed a starter catalog:
 *   docker compose exec product-service node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const SAMPLE_PRODUCTS = [
  { title: 'Wireless Noise-Cancelling Headphones', price: 129.99, category: 'Electronics', brand: 'SoundCore', stock: 50, description: 'Over-ear headphones with active noise cancellation and 30h battery life.' },
  { title: '4K Ultra HD Smart TV 55"', price: 449.0, category: 'Electronics', brand: 'Visionix', stock: 20, description: 'Crisp 4K HDR display with built-in streaming apps.' },
  { title: 'Mechanical Keyboard RGB', price: 79.5, category: 'Electronics', brand: 'KeyForge', stock: 80, description: 'Hot-swappable mechanical switches with per-key RGB lighting.' },
  { title: "Men's Running Shoes", price: 59.99, category: 'Fashion', brand: 'Stridewell', stock: 100, description: 'Lightweight breathable running shoes with cushioned sole.' },
  { title: "Women's Denim Jacket", price: 45.0, category: 'Fashion', brand: 'Urbane', stock: 60, description: 'Classic fit denim jacket, machine washable.' },
  { title: 'Stainless Steel Cookware Set (10-piece)', price: 149.0, category: 'Home & Kitchen', brand: 'ChefLine', stock: 30, description: 'Durable stainless steel pots and pans with heat-resistant handles.' },
  { title: 'Robot Vacuum Cleaner', price: 199.99, category: 'Home & Kitchen', brand: 'CleanBot', stock: 25, description: 'Smart mapping robot vacuum with app control.' },
  { title: 'Yoga Mat with Carry Strap', price: 24.99, category: 'Sports & Outdoors', brand: 'FlexFit', stock: 150, description: 'Non-slip eco-friendly yoga mat, 6mm thick.' },
  { title: 'Adjustable Dumbbell Set', price: 189.0, category: 'Sports & Outdoors', brand: 'IronCore', stock: 40, description: 'Space-saving adjustable dumbbells, 5-50 lbs per side.' },
  { title: 'Bestselling Mystery Novel (Paperback)', price: 14.99, category: 'Books', brand: 'PenPress', stock: 200, description: 'A gripping page-turner from a bestselling author.' },
  { title: "Kids' Building Blocks Set (200 pcs)", price: 34.99, category: 'Toys', brand: 'BuildJoy', stock: 90, description: 'Creative building blocks compatible with major brands.' },
  { title: 'Espresso Machine', price: 249.0, category: 'Home & Kitchen', brand: 'BrewCraft', stock: 15, description: '15-bar pump espresso machine with milk frother.' },
];

async function seed() {
  await mongoose.connect(process.env.PRODUCT_MONGO_URI || 'mongodb://mongo:27017/product_db');
  console.log('Connected to product_db, seeding...');

  await Product.deleteMany({});
  const withSeller = SAMPLE_PRODUCTS.map((p) => ({ ...p, sellerId: 'seed-seller-001', currency: 'USD' }));
  await Product.insertMany(withSeller);

  console.log(`Seeded ${withSeller.length} products.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const proxy = require('express-http-proxy');
const axios = require('axios');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:4001',
  user: process.env.USER_SERVICE_URL || 'http://user-service:4002',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:4003',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:4004',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4005',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:4006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4007',
};

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// ---------- Aggregated DB / infra health across ALL microservices ----------
app.get('/api/system/db-info', async (req, res) => {
  const results = {};
  await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const { data } = await axios.get(`${url}/db-info`, { timeout: 3000 });
        results[name] = data.db;
      } catch (err) {
        results[name] = { connected: false, error: err.message };
      }
    })
  );
  res.json({ services: results, checkedAt: new Date().toISOString() });
});

app.get('/api/system/health', async (req, res) => {
  const results = {};
  await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        await axios.get(`${url}/health`, { timeout: 3000 });
        results[name] = 'up';
      } catch (err) {
        results[name] = 'down';
      }
    })
  );
  res.json({ services: results, checkedAt: new Date().toISOString() });
});

function stripPrefix(prefix) {
  return (req) => {
    const rest = req.originalUrl.slice(prefix.length) || '/';
    return rest.startsWith('/') ? rest : '/' + rest;
  };
}

app.use('/api/auth', proxy(SERVICES.auth, { proxyReqPathResolver: stripPrefix('/api/auth') }));
app.use('/api/users', proxy(SERVICES.user, { proxyReqPathResolver: stripPrefix('/api/users') }));
app.use('/api/products', proxy(SERVICES.product, { proxyReqPathResolver: stripPrefix('/api/products') }));
app.use('/api/orders', proxy(SERVICES.order, { proxyReqPathResolver: stripPrefix('/api/orders') }));
app.use('/api/payments', proxy(SERVICES.payment, { proxyReqPathResolver: stripPrefix('/api/payments') }));
app.use('/api/inventory', proxy(SERVICES.inventory, { proxyReqPathResolver: stripPrefix('/api/inventory') }));
app.use('/api/notifications', proxy(SERVICES.notification, { proxyReqPathResolver: stripPrefix('/api/notifications') }));
app.use((req, res) => res.status(404).json({ message: 'Route not found on gateway' }));

app.listen(PORT, () => console.log(`[api-gateway] listening on port ${PORT}`));

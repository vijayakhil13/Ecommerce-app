require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB, getDbInfo } = require('./config/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.AUTH_PORT || 4001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Database server info endpoint (as requested: API to inspect DB server status)
app.get('/db-info', (req, res) => res.json({ service: 'auth-service', db: getDbInfo() }));

app.use('/', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => console.log(`[auth-service] listening on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const paymentRoutes = require('./routes/payment.routes');
const { initKafka } = require('./kafka/kafka');

const app = express();
const PORT = process.env.PAYMENT_PORT || 4005;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
initKafka().catch((err) => console.error('[payment-service] Kafka init failed:', err.message));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'payment-service', db: getDbInfo() }));
app.use('/', paymentRoutes);

app.listen(PORT, () => console.log(`[payment-service] listening on port ${PORT}`));

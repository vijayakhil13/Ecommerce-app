require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const orderRoutes = require('./routes/order.routes');
const { initKafka } = require('./kafka/kafka');

const app = express();
const PORT = process.env.ORDER_PORT || 4004;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
initKafka().catch((err) => console.error('[order-service] Kafka init failed:', err.message));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'order-service', db: getDbInfo() }));
app.use('/', orderRoutes);

app.listen(PORT, () => console.log(`[order-service] listening on port ${PORT}`));

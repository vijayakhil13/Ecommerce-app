require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const inventoryRoutes = require('./routes/inventory.routes');
const { initKafka } = require('./kafka/kafka');

const app = express();
const PORT = process.env.INVENTORY_PORT || 4006;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
initKafka().catch((err) => console.error('[inventory-service] Kafka init failed:', err.message));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'inventory-service', db: getDbInfo() }));
app.use('/', inventoryRoutes);

app.listen(PORT, () => console.log(`[inventory-service] listening on port ${PORT}`));

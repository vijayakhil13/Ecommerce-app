require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const notificationRoutes = require('./routes/notification.routes');
const { initKafka } = require('./kafka/kafka');

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 4007;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
initKafka().catch((err) => console.error('[notification-service] Kafka init failed:', err.message));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'notification-service', db: getDbInfo() }));
app.use('/', notificationRoutes);

app.listen(PORT, () => console.log(`[notification-service] listening on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.USER_PORT || 4002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'user-service', db: getDbInfo() }));
app.use('/', userRoutes);

app.listen(PORT, () => console.log(`[user-service] listening on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, getDbInfo } = require('./config/db');
const productRoutes = require('./routes/product.routes');

const app = express();
const PORT = process.env.PRODUCT_PORT || 4003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));
app.get('/db-info', (req, res) => res.json({ service: 'product-service', db: getDbInfo() }));
app.use('/', productRoutes);

app.listen(PORT, () => console.log(`[product-service] listening on port ${PORT}`));

// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});

// Routes
app.use(menuItemRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(ratingRoutes);

module.exports = app;

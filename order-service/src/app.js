// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load models trước để đảm bảo associations được thiết lập
require('./models');

const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});

// Routes - mount với prefix để tránh conflict
app.use('/orders', orderRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/payments', paymentRoutes);
app.use('/ratings', ratingRoutes);
app.use('/api/carts', cartRoutes);

// Debug: Log tất cả routes đã mount
console.log('Order-Service Routes mounted:');
console.log('  - /orders');
console.log('  - /menu-items');
console.log('  - /payments');
console.log('  - /ratings');
console.log('  - /api/carts');

module.exports = app;

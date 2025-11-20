// src/app.js
const express = require('express');
const dotenv = require('dotenv');
const reservationRoutes = require('./routes/reservationRoutes');
const tableRoutes = require('./routes/tableRoutes')

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use('/tables', tableRoutes);
app.use('/', reservationRoutes);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'reservation-service' });
});

module.exports = app;

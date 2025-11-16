const express = require('express');
const sequelize = require('./config/database');
require('dotenv').config();

const reservationRoutes = require('./routes/reservationRoutes');

const app = express();
app.use(express.json());

app.use('/api/reservations', reservationRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'reservation-service' });
});

const PORT = process.env.PORT || 3002;

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Reservation service connected to PostgreSQL");

        app.listen(PORT, () => {
            console.log(`Reservation Service running on port ${PORT}`);
        });

    } catch (err) {
        console.error("DB connection error:", err.message);
    }
})();

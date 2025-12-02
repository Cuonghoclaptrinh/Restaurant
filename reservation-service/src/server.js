// const express = require('express');
// const sequelize = require('./config/database');
// require('dotenv').config();

// const reservationRoutes = require('./routes/reservationRoutes');

// const app = express();
// app.use(express.json());

// app.use( reservationRoutes);

// app.get('/health', (req, res) => {
//     res.json({ status: 'OK', service: 'reservation-service' });
// });

// const PORT = process.env.PORT || 3002;

// (async () => {
//     try {
//         await sequelize.authenticate();
//         console.log("Reservation service connected to PostgreSQL");

//         app.listen(PORT, () => {
//             console.log(`Reservation Service running on port ${PORT}`);
//         });

//     } catch (err) {
//         console.error("DB connection error:", err.message);
//     }
// })();



require('./tracing');
const app = require('./app');
const { sequelize } = require('./models'); 

const PORT = process.env.PORT || 3001;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Order-Service: Database connected');

        console.log('Order-Service: Loaded models:', Object.keys(sequelize.models));

        // await sequelize.sync({ alter: true });

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Order Service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Order-Service: Unable to connect to the database:', error.message);
        process.exit(1);
    }
})();

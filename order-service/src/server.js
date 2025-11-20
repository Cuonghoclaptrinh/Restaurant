const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const { startReservationConsumer } = require('./mq/consumer')


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});

app.use(express.json());
app.use(menuItemRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(ratingRoutes);

const PORT = process.env.PORT || 3001;

const { sequelize } = require('./models');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Order-Service: Database connected');

        console.log('Order-Service: Loaded models:', Object.keys(sequelize.models));

        // Tạo/alter bảng nếu cần
        // await sequelize.sync({ alter: true });
        // console.log('Order-Service: Database synced');
        
        startReservationConsumer();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Order Service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Order-Service: Unable to connect to the database:', error.message);
        process.exit(1);
    }
})();
require('./tracing');
const dotenv = require('dotenv');
const app = require('./app');
const { startReservationConsumer } = require('./mq/consumer');

dotenv.config();

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
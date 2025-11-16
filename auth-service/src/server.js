// src/server.js (hoặc index.js tùy bạn đặt)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const seedAdmin = require('./seedAdmin')

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 3003;

// ✅ DÙNG CHUNG INSTANCE sequelize TỪ config/database.js
const sequelize = require('./config/database');

// ✅ IMPORT MODEL TRƯỚC KHI SYNC (rất quan trọng)
require('./models/user');
require('./models/userProfile');

async function startServer() {
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
        try {
            await sequelize.authenticate();
            console.log('Database connected successfully.');

            // ✅ Tạo bảng users nếu chưa có
            await sequelize.sync({ alter: true });
            console.log('Database synced');

            await seedAdmin();

            app.listen(PORT, '0.0.0.0', () => {
                console.log(`Auth Service running on http://localhost:${PORT}`);
            });
            return;
        } catch (error) {
            attempts++;
            console.log(`Connection attempt ${attempts}/${maxAttempts} failed. Retrying in 3s...`);
            console.log('Error:', error.message);
            await new Promise((res) => setTimeout(res, 3000));
        }
    }

    console.error('Failed to connect to database after 15 attempts');
    process.exit(1);
}

startServer();

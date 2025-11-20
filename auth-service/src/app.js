// auth-service/src/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes')
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

// Routes
// Nếu routes/auth.js đang/router.post('/login') thì dùng thẳng:
app.use(authRoutes);
app.use('/auth', userRoutes)
app.use(profileRoutes);


module.exports = app;

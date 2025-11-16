const express = require('express');
const { register, login, createAdmin } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const router = express.Router();

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

const admin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Chỉ ADMIN' });
    }
    next();
};

router.post('/register', register);
router.post('/login', login);
router.post('/admin', protect, admin, createAdmin);

module.exports = router;
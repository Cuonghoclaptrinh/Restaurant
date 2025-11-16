const express = require('express');
const jwt = require('jsonwebtoken');
const { getMyProfile, upsertMyProfile } = require('../controllers/profileController');

const router = express.Router();

// copy từ auth routes cho nhất quán
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

router.get('/me', protect, getMyProfile);
router.put('/me', protect, upsertMyProfile);

module.exports = router;

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/userProfile');
const { ensureCartForUser } = require('../utils/cartClient');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

exports.register = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email đã tồn tại' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'USER',
        });

        await UserProfile.create({
            userId: user.id,
            fullName: null,
            phone: null,
            address: null,
            city: null,
            country: 'Vietnam',
        });

        const userId = user.id;

        try {
            await ensureCartForUser(userId);
        } catch (err) {
            // Không nên làm fail luôn đăng ký nếu cart bị lỗi
            console.error(
                '⚠️ Signup ok nhưng create cart failed for userId',
                userId
            );
        }

        const token = generateToken({ id: user.id, role: user.role });

        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
        }

        const token = generateToken({ id: user.id, role: user.role });

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createAdmin = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Chỉ ADMIN mới tạo được admin' });
    }

    const { email, password } = req.body;
    try {
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email đã tồn tại' });

        const hashed = await bcrypt.hash(password, 10);
        const admin = await User.create({
            email,
            password: hashed,
            role: 'ADMIN',
        });
        res.status(201).json({ message: 'Admin created', id: admin.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
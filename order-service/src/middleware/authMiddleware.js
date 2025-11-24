// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(requiredRoles = []) {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization || req.headers.Authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback_secret'
            );

            req.user = {
                id: decoded.id,
                role: decoded.role,
            };

            if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
                console.log('❌ ROLE CHECK FAILED', {
                    decodedRole: decoded.role,
                    requiredRoles,
                });
                return res.status(403).json({ message: 'Forbidden: insufficient role' });
            }

            next();
        } catch (err) {
            console.error('authMiddleware error:', err.message);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
}

module.exports = authMiddleware;

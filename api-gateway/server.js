require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');

const app = express();

const PORT = process.env.PORT || 4100;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3003';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://reservation-service:3002';

// kết nối redis
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => {
    console.log('✅ API Gateway connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error in API Gateway:', err.message);
});

// 🔍 Log mọi request đi vào Gateway
app.use((req, res, next) => {
    console.log('REQUEST PATH:', req.path, 'METHOD:', req.method);
    next();
});

app.use(cors());
// ❌ KHÔNG dùng express.json() ở đây – để service phía sau tự parse body
// app.use(express.json());

// Health check của gateway
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'api-gateway' });
});

// 🚦 Global rate limit dùng Redis
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,        // 15 phút
    max: 500,                        // tối đa 500 request / 15 phút / 1 IP
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    store: new RedisStore({
        // dùng ioredis: .call hoặc .sendCommand đều OK
        sendCommand: (...args) => redisClient.call(...args),
        // prefix: 'rl:global:', // nếu muốn prefix riêng
    }),
    handler: (req, res) => {
        console.warn('Rate limit hit (global):', req.ip, req.originalUrl);
        return res.status(429).json({
            message: 'Bạn gọi API quá nhiều, vui lòng thử lại sau ít phút.',
        });
    },
});

// ⚠️ Rate limit riêng cho login (chống brute-force)
const loginLimiter = rateLimit({
    windowMs: 15*60 * 1000,
    max: 10,                         // 10 lần / 15 phút
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        // prefix: 'rl:login:',
    }),
    handler: (req, res) => {
        console.warn('Rate limit hit (login):', req.ip, req.originalUrl);
        return res.status(429).json({
            message: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.',
        });
    },
});
// 👉 Áp dụng global limiter cho mọi route (sau /health trở đi)
app.use(globalLimiter);

// 👉 Áp dụng login limiter riêng cho /auth/login
app.use('/auth/login', loginLimiter);

// 🌐 Proxy tới auth-service
app.use(
    '/auth',
    createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/auth': '' },
        router: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log('→ AUTH PROXY:', req.method, req.originalUrl, '=>', proxyReq.path);
        },
        onError(err, req, res) {
            console.error('Proxy Error [AUTH]:', err.message);
            if (!res.headersSent) {
                res.status(502).json({ message: 'Auth service unavailable', error: err.message });
            }
        },
    })
);

// 🌐 Proxy tới order-service
// Giữ nguyên path /orders vì Express tự động xử lý prefix khi mount router
// Flow: Frontend -> /orders -> API Gateway -> /orders -> Order-service
// Order-service: app.use('/orders', orderRoutes) sẽ match và gửi path còn lại tới router
// Router: router.get('/') sẽ match với path còn lại (sau khi bỏ /orders)
app.use(
    '/orders',
    createProxyMiddleware({
        target: ORDER_SERVICE_URL,
        changeOrigin: true,
        // Không rewrite - giữ nguyên path để Express tự xử lý
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log('→ ORDER PROXY:', req.method, req.originalUrl, '=>', proxyReq.path);
        },
        onError(err, req, res) {
            console.error('Proxy Error [ORDER]:', err.message);
            if (!res.headersSent) {
                res.status(502).json({ message: 'Order service unavailable', error: err.message });
            }
        },
    })
);

// 🌐 Proxy tới reservation-service
app.use(
    '/reservations',
    createProxyMiddleware({
        target: RESERVATION_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/reservations': '' },
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log('→ RES PROXY:', req.method, req.originalUrl, '=>', proxyReq.path);
        },
        onError(err, req, res) {
            console.error('Proxy Error [RESERVATION]:', err.message);
            if (!res.headersSent) {
                res.status(502).json({ message: 'Reservation service unavailable', error: err.message });
            }
        },
    })
);

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log('AUTH_SERVICE_URL =', AUTH_SERVICE_URL);
    console.log('ORDER_SERVICE_URL =', ORDER_SERVICE_URL);
    console.log('RESERVATION_SERVICE_URL =', RESERVATION_SERVICE_URL);
});

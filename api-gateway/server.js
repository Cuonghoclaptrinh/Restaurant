require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const PORT = process.env.PORT || 4100;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3003';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://reservation-service:3002';

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
app.use(
    '/orders',
    createProxyMiddleware({
        target: ORDER_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/orders': '' },
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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');
const { callGemini } = require('./geminiClient');

const app = express();
const PORT = process.env.PORT || 4100;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3003';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://reservation-service:3002';

// Kết nối Redis
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
// ❌ KHÔNG dùng express.json() global – để service phía sau tự parse body
// app.use(express.json());

// Health check của gateway (không bị rate limit)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'api-gateway' });
});

// 🚦 Global rate limit dùng Redis (áp dụng sau health)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 1000, // 1000 request / phút cho toàn hệ thống
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: () => 'global', // toàn hệ thống chỉ 1 key
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    handler: (req, res) => {
        console.warn('⚠️ Global rate limit hit:', req.originalUrl);
        return res.status(429).json({
            message: "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.",
        });
    },
});

// ⚠️ Rate limit riêng cho login (chống brute-force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 lần / 15 phút
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    handler: (req, res) => {
        console.warn('Rate limit hit (login):', req.ip, req.originalUrl);
        return res.status(429).json({
            message: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.',
        });
    },
});

// 👉 Áp dụng global limiter cho mọi route (trừ health)
app.use(globalLimiter);
// 👉 Áp dụng login limiter riêng cho /auth/login
app.use('/auth/login', loginLimiter);

// 🧠 ChatBot route – dùng express.json() cục bộ (không bị proxy, rate limit vẫn apply)
app.post('/chat', express.json(), async (req, res) => {
    console.log('[/chat] Received request:', {
        message: req.body?.message?.substring(0, 50),
        hasHistory: !!req.body?.history,
        scope: req.body?.scope
    });
    try {
        const { message, history, scope } = req.body || {};

        if (!message || typeof message !== 'string') {
            console.log('[/chat] Invalid message');
            return res.status(400).json({ message: 'message is required' });
        }

        console.log('[/chat] Calling Gemini API...');

        // Chọn tên nhân viên (Quí, Bảo Anh, hoặc Huyền Anh)
        const names = ['Quí', 'Bảo Anh', 'Huyền Anh'];
        const randomName = names[Math.floor(Math.random() * names.length)];

        // Lấy menu data từ order-service để AI có thể tìm món
        let menuData = [];
        try {
            const menuResponse = await fetch(`${ORDER_SERVICE_URL}/menu-items`);
            if (menuResponse.ok) {
                const json = await menuResponse.json();
                // API trả về dạng { data: [...], pagination, fromCache }
                menuData = Array.isArray(json)
                    ? json
                    : Array.isArray(json.data)
                        ? json.data
                        : [];
            } else {
                console.error('[/chat] menuResponse not ok:', menuResponse.status);
            }
        } catch (err) {
            console.error('[/chat] Failed to fetch menu data:', err.message);
        }

        // Format menu data để đưa vào context cho AI
        const menuContext = menuData.length > 0
            ? menuData.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description || '',
                category: item.category,
                type: item.type,
                tags: item.tags || []
            })).slice(0, 50) // Giới hạn 50 món để không quá dài
            : [];

        // System prompt: nói rõ persona + phong cách trả lời + menu context
        const systemPrompt = `
Bạn là trợ lý AI của một nhà hàng cao cấp, nói chuyện bằng tiếng Việt thật gần gũi, lễ phép nhưng thoải mái.

TÊN CỦA BẠN: Em tên là ${randomName}. Khi khách hỏi tên, em luôn trả lời: "Em tên là ${randomName} ạ" hoặc tương tự.

XƯNG HÔ VỚI KHÁCH HÀNG:
- Khi chưa biết tên khách: xưng "em - anh/chị" hoặc "em - khách"
- Khi khách tự giới thiệu tên (ví dụ: "Tôi tên là Nam", "Mình là Lan", "Anh là Minh", "Chị là Hương"):
  + Lưu lại tên khách và sử dụng trong các câu trả lời tiếp theo
  + Xưng hô: "em - anh/chị [TÊN]" (ví dụ: "anh Nam", "chị Lan", "anh Minh", "chị Hương")
  + Nếu khách là nữ: dùng "chị [TÊN]"
  + Nếu khách là nam: dùng "anh [TÊN]"
  + Nếu không rõ giới tính: dùng "anh/chị [TÊN]" hoặc "bạn [TÊN]"
- Khi chào lại khách trong các tin nhắn sau: "Chào lại anh/chị [TÊN]!" hoặc "Xin chào anh/chị [TÊN]!"

MENU HIỆN CÓ:
${menuContext.length > 0
                ? JSON.stringify(menuContext, null, 2)
                : 'Hiện tại em chưa có thông tin menu, em sẽ trả lời chung chung.'}

QUY TẮC QUAN TRỌNG:
1. Khi khách hỏi về món ăn cụ thể:
   - Tìm món trong MENU HIỆN CÓ ở trên (tìm theo tên, mô tả, hoặc tags)
   - Nếu tìm thấy 1 món: trả lời tên món, giá, mô tả (nếu có), và CUỐI CÂU thêm: "[PRODUCT_ID:ID_CỦA_MÓN]" (chỉ ID của món đó thôi)
   - Nếu tìm thấy nhiều món: liệt kê các món, mỗi món có "[PRODUCT_ID:ID]" riêng
   - Ví dụ: "Món Phở Bò của quán giá 150,000đ, món này rất ngon ạ. [PRODUCT_ID:1]"
   - Ví dụ nhiều món: "Quán có Phở Bò [PRODUCT_ID:1] và Bún Bò [PRODUCT_ID:2] ạ."

2. Khi khách hỏi tên: "Em tên là ${randomName} ạ"

3. Khi khách tự giới thiệu tên:
   - Lưu lại tên khách và xác nhận: "Dạ em chào anh/chị [TÊN]! Rất vui được phục vụ anh/chị ạ."
   - Từ đó trở đi, luôn xưng hô đúng tên: "anh/chị [TÊN]" trong mọi câu trả lời
   - Ví dụ: Nếu khách nói "Tôi tên là Nam" → Trả lời: "Dạ em chào anh Nam! Rất vui được phục vụ anh ạ."
   - Sau đó mọi câu trả lời đều dùng: "anh Nam", "dạ anh Nam", "anh Nam ơi", v.v.

4. Luôn ưu tiên trả lời ngắn gọn, dễ hiểu, sau đó mới gợi ý thêm nếu cần.

5. Không bịa thông tin về giá, chương trình khuyến mãi, giờ mở cửa nếu không chắc chắn – hãy dùng cách trả lời an toàn như: "cái này em cần kiểm tra thêm giúp anh/chị [TÊN]".

6. Nếu khách hỏi về menu tổng quát, hãy gợi ý theo nhóm món (khai vị, món chính, tráng miệng, đồ uống) và gợi ý combo nếu phù hợp.

7. Nếu khách hỏi về đặt bàn/đặt món, hãy hỏi lại đầy đủ: thời gian, số người, chi nhánh (nếu có nhiều chi nhánh), yêu cầu đặc biệt.

8. Luôn giữ giọng điệu tích cực, niềm nở, không dùng từ ngữ tiêu cực.

9. QUAN TRỌNG NHẤT - XƯNG HÔ ĐÚNG TÊN:
   - Nếu đã biết tên khách từ các tin nhắn trước trong history, LUÔN sử dụng tên đó trong mọi câu trả lời
   - Ví dụ: Nếu khách đã nói tên là "Nam" → Dùng "anh Nam" trong mọi câu trả lời
   - Ví dụ: Nếu khách đã nói tên là "Lan" → Dùng "chị Lan" trong mọi câu trả lời
   - KHÔNG BAO GIỜ quên tên khách đã giới thiệu, luôn nhớ và sử dụng trong các tin nhắn tiếp theo
`.trim();

        const reply = await callGemini({
            systemPrompt,
            userMessage: message,
            history: Array.isArray(history) ? history : [],
        });

        // Parse tất cả PRODUCT_ID từ reply (format: [PRODUCT_ID:1] hoặc [PRODUCT_ID:2])
        // Có thể có nhiều [PRODUCT_ID:...] trong một reply
        const productIdMatches = reply.matchAll(/\[PRODUCT_ID:(\d+)\]/g);
        let productIds = [];
        for (const match of productIdMatches) {
            const id = parseInt(match[1]);
            if (!isNaN(id) && !productIds.includes(id)) {
                productIds.push(id);
            }
        }
        productIds = productIds.length > 0 ? productIds : null;

        // Loại bỏ [PRODUCT_ID:...] khỏi reply để hiển thị sạch hơn
        const cleanReply = reply.replace(/\[PRODUCT_ID:\d+\]/g, '').trim();

        return res.json({
            reply: cleanReply,
            assistantName: randomName,
            scope: scope || null,
            productIds: productIds, // Array of product IDs để frontend navigate
        });
    } catch (err) {
        console.error('[/chat] error:', err);
        console.error('Error stack:', err.stack);
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Xin lỗi anh/chị, hiện tại em đang gặp chút trục trặc, mình thử lại giúp em sau ít phút nhé.',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            });
        }
    }
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

// 🌐 Proxy tới reservation-service cho /tables (giữ nguyên path)
app.use(
    '/tables',
    createProxyMiddleware({
        target: RESERVATION_SERVICE_URL,
        changeOrigin: true,
        // Không rewrite để giữ /tables
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log('→ TABLES PROXY:', req.method, req.originalUrl, '=>', proxyReq.path);
        },
        onError(err, req, res) {
            console.error('Proxy Error [TABLES]:', err.message);
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
    console.log('GEMINI_API_KEY =', process.env.GEMINI_API_KEY ? '**SET**' : 'NOT SET!');
    console.log('GEMINI_MODEL =', process.env.GEMINI_MODEL || 'gemini-1.5-flash');
});
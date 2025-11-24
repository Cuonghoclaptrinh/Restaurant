// auth-service/src/utils/cartClient.js
const axios = require('axios');

const ORDER_SERVICE_URL =
    process.env.ORDER_SERVICE_URL || 'http://order-service:3001';

async function ensureCartForUser(userId) {
    if (!userId) {
        throw new Error('userId is required to ensure cart');
    }

    try {
        const res = await axios.post(
            `${ORDER_SERVICE_URL}/carts/system/create`,
            { userId },
            {
                headers: {
                    'x-internal-secret':
                        process.env.INTERNAL_SERVICE_SECRET || 'wowwraps_internal_secret',
                },
                timeout: 5000,
            }
        );

        console.log('✅ ensureCartForUser ok, userId =', userId);
        return res.data; // cart đã được tạo hoặc lấy ra
    } catch (error) {
        console.error(
            '❌ ensureCartForUser failed:',
            error.response?.status,
            error.response?.data || error.message
        );
        throw error;
    }
}

module.exports = { ensureCartForUser };

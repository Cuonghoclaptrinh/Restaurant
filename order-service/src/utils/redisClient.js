// src/utils/redisClient.js
const { createClient } = require('redis')

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379'

const redisClient = createClient({
    url: REDIS_URL,
})

redisClient.on('error', (err) => {
    console.error('🔴 Redis error:', err.message)
})

redisClient.on('connect', () => {
    console.log('🟢 Redis connected to', REDIS_URL)
})

// Kết nối (promise, không cần await ở đây)
redisClient.connect().catch((err) => {
    console.error('Redis connect fail:', err.message)
})

module.exports = redisClient

// reservation-service/src/mq/publisher.js
const amqp = require('amqplib')

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitmq:5672'
const QUEUE_NAME =
    process.env.RESERVATION_ORDER_QUEUE || 'reservation.order.created'

let channel

async function getChannel() {
    if (channel) return channel

    const conn = await amqp.connect(RABBIT_URL)
    channel = await conn.createChannel()
    await channel.assertQueue(QUEUE_NAME, {
        durable: true, // queue bền, service down vẫn giữ message
    })

    console.log('🟢 [MQ] Connected & queue asserted:', QUEUE_NAME)
    return channel
}

/**
 * Publish message khi reservation được tạo
 */
async function publishReservationCreated(payload) {
    try {
        const ch = await getChannel()
        const msgBuffer = Buffer.from(JSON.stringify(payload))

        ch.sendToQueue(QUEUE_NAME, msgBuffer, {
            persistent: true, // message bền, ghi ra disk
        })

        console.log('📤 [MQ] Published reservation.created:', payload)
    } catch (err) {
        console.error('🔴 [MQ] Publish reservation.created error:', err.message)
    }
}

module.exports = {
    publishReservationCreated,
}

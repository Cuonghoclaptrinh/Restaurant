// order-service/src/mq/consumer.js
const amqp = require('amqplib')
const { Order } = require('../models')   // nếu models export khác, mình chỉnh lại sau

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitmq:5672'
const QUEUE_NAME =
    process.env.RESERVATION_ORDER_QUEUE || 'reservation.order.created'

async function startReservationConsumer() {
    try {
        const conn = await amqp.connect(RABBIT_URL)
        const channel = await conn.createChannel()

        await channel.assertQueue(QUEUE_NAME, { durable: true })

        console.log('🟢 [MQ] Order-service listening on queue:', QUEUE_NAME)

        channel.consume(
            QUEUE_NAME,
            async (msg) => {
                if (!msg) return

                try {
                    const data = JSON.parse(msg.content.toString())
                    console.log('📥 [MQ] Received reservation.created:', data)

                    // Tạo order tương ứng
                    const order = await Order.create({
                        orderType: 'dine-in',
                        tableId: data.tableId || null,
                        reservationId: data.reservationId || null,
                        userId: null,
                        customerName: data.customerName || null,
                        customerPhone: data.customerPhone || null,
                        status: 'pending',
                        total: 0,
                    })

                    console.log(
                        '✅ [MQ] Created order from reservation:',
                        order.id,
                        ' (reservationId =',
                        data.reservationId,
                        ')'
                    )

                    // ACK: xử lý xong message
                    channel.ack(msg)
                } catch (err) {
                    console.error('🔴 [MQ] Error handling reservation.created:', err.message)
                    // tuỳ bạn: requeue lại hay bỏ luôn
                    // channel.nack(msg, false, true) // requeue
                    channel.ack(msg) // tránh retry vô hạn, demo cho đơn giản
                }
            },
            {
                noAck: false,
            }
        )
    } catch (err) {
        console.error('🔴 [MQ] Cannot start reservation consumer:', err.message)
    }
}

module.exports = {
    startReservationConsumer,
}

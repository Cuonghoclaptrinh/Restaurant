// order-service/src/mq/consumer.js
const amqp = require('amqplib');
const { Order } = require('../models');

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitmq:5672';
const QUEUE_NAME =
    process.env.RESERVATION_ORDER_QUEUE || 'reservation.order.created';

async function startReservationConsumer(retryDelayMs = 5000) {
    async function connectAndConsume() {
        try {
            console.log('🔄 [MQ] Trying to connect to RabbitMQ at', RABBIT_URL);

            const conn = await amqp.connect(RABBIT_URL);
            const channel = await conn.createChannel();

            await channel.assertQueue(QUEUE_NAME, { durable: true });

            console.log('🟢 [MQ] Order-service listening on queue:', QUEUE_NAME);

            channel.consume(
                QUEUE_NAME,
                async (msg) => {
                    if (!msg) return;

                    try {
                        const data = JSON.parse(msg.content.toString());
                        console.log('📥 [MQ] Received reservation.created:', data);

                        const order = await Order.create({
                            orderType: 'dine-in',
                            tableId: data.tableId || null,
                            reservationId: data.reservationId || null,
                            userId: null,
                            customerName: data.customerName || null,
                            customerPhone: data.customerPhone || null,
                            status: 'pending',
                            total: 0,
                        });

                        console.log(
                            '✅ [MQ] Created order from reservation:',
                            order.id,
                            '(reservationId =', data.reservationId, ')'
                        );

                        channel.ack(msg);
                    } catch (err) {
                        console.error('🔴 [MQ] Error handling reservation.created:', err.message);
                        channel.ack(msg); // demo: tránh retry vô hạn
                    }
                },
                { noAck: false }
            );

            // Nếu mất kết nối giữa chừng → thử kết nối lại
            conn.on('close', () => {
                console.error('🔴 [MQ] RabbitMQ connection closed, retrying in', retryDelayMs, 'ms');
                setTimeout(connectAndConsume, retryDelayMs);
            });

            conn.on('error', (err) => {
                console.error('🔴 [MQ] RabbitMQ connection error:', err.message);
            });
        } catch (err) {
            console.error(
                '🔴 [MQ] Cannot connect to RabbitMQ (will retry in',
                retryDelayMs,
                'ms):',
                err.message
            );
            setTimeout(connectAndConsume, retryDelayMs);
        }
    }

    connectAndConsume();
}

module.exports = {
    startReservationConsumer,
};

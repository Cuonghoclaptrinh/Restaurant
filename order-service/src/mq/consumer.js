// order-service/src/mq/consumer.js
const amqp = require('amqplib');
const { Order } = require('../models');

const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('order-service');

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

                    // 🔹 Tạo span cho mỗi message được xử lý
                    const span = tracer.startSpan('mq.reservation.created', {
                        attributes: {
                            'messaging.system': 'rabbitmq',
                            'messaging.destination': QUEUE_NAME,
                            'messaging.operation': 'process',
                        },
                    });

                    try {
                        const data = JSON.parse(msg.content.toString());
                        console.log('📥 [MQ] Received reservation.created:', data);

                        span.setAttribute('reservation.id', data.reservationId || 'none');
                        span.setAttribute('table.id', data.tableId || 'none');
                        span.setAttribute('reservation.party_size', data.partySize || 0);

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

                        span.setAttribute('order.id', order.id);
                        span.setStatus({ code: 0 });

                        console.log(
                            '✅ [MQ] Created order from reservation:',
                            order.id,
                            '(reservationId =', data.reservationId, ')'
                        );

                        channel.ack(msg);
                    } catch (err) {
                        console.error('🔴 [MQ] Error handling reservation.created:', err.message);
                        span.recordException(err);
                        span.setStatus({ code: 1, message: err.message });
                        channel.ack(msg); // demo: tránh retry vô hạn
                    } finally {
                        span.end();
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

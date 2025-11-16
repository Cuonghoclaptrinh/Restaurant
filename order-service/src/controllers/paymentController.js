const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Payment = require('../models/payment');
const Order = require('../models/order');

class PaymentController {

    // Validator cho POST
    static validateCreatePayment() {
        return [
            body('orderId').isInt({ min: 1 }).withMessage('orderId must be positive'),
            body('method')
                .isIn(['cash', 'card', 'mobile'])
                .withMessage('method must be cash | card | mobile'),
            body('status')
                .optional()
                .isIn(['pending', 'completed', 'failed'])
        ];
    }

    // Validator cho PUT
    static validateUpdatePayment() {
        return [
            body('status')
                .notEmpty()
                .isIn(['pending', 'completed', 'failed'])
                .withMessage('Invalid status')
        ];
    }

    // POST /api/payments
    static async createPayment(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId, method } = req.body;

            // 1. Kiểm tra order
            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // 2. Lấy total từ order
            const amount = Number(order.total);

            // 3. Tạo payment
            const payment = await Payment.create({
                orderId,
                amount,
                method,
                status: 'completed' // hoặc pending tùy tích hợp Momo/ZaloPay sau
            });

            // 4. Cập nhật trạng thái order
            await order.update({ status: 'completed' });

            res.status(201).json(payment);
        } catch (error) {
            console.error('createPayment error:', error);
            res.status(500).json({ error: error.message });
        }
    }


    // GET /api/payments
    static async getAllPayments(req, res) {
        try {
            const { orderId, status } = req.query;
            const where = {};

            if (orderId) where.orderId = orderId;
            if (status) where.status = { [Op.iLike]: status };

            const payments = await Payment.findAll({ where });
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/payments/:id
    static async updatePayment(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = req.params;
            const { status } = req.body;

            const payment = await Payment.findByPk(id);
            if (!payment) return res.status(404).json({ error: 'Payment not found' });

            await payment.update({ status });

            // Update order status nếu thanh toán thành công
            const order = await Order.findByPk(payment.orderId);
            if (order && status === 'completed') {
                await order.update({ status: 'completed' });
            }

            res.json(payment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = PaymentController;

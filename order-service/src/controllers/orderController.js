// src/controllers/orderController.js
const { body, validationResult } = require('express-validator');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

class OrderController {
    // Validator cho tạo order
    static validateCreateOrder() {
        return [
            // orderType: dine-in | delivery (optional, default dine-in)
            body('orderType')
                .optional()
                .isIn(['dine-in', 'delivery'])
                .withMessage('orderType must be "dine-in" or "delivery"'),

            // tableId: INTEGER, có thể null
            body('tableId')
                .optional({ nullable: true })
                .isInt({ min: 1 })
                .withMessage('tableId must be a positive integer'),

            // reservationId: INTEGER, có thể null
            body('reservationId')
                .optional({ nullable: true })
                .isInt({ min: 1 })
                .withMessage('reservationId must be a positive integer'),

            // userId: INTEGER, có thể null
            body('userId')
                .optional({ nullable: true })
                .isInt({ min: 1 })
                .withMessage('userId must be a positive integer'),

            // deliveryAddress: cho delivery
            body('deliveryAddress')
                .optional({ nullable: true })
                .isString()
                .withMessage('deliveryAddress must be a string'),

            body('deliveryNote')
                .optional({ nullable: true })
                .isString()
                .withMessage('deliveryNote must be a string'),

            body('customerName')
                .optional({ nullable: true })
                .isString()
                .withMessage('customerName must be a string'),

            body('customerPhone')
                .optional({ nullable: true })
                .isString()
                .withMessage('customerPhone must be a string'),
        ];
    }

    // Validator cho update order (chỉ status)
    static validateUpdateOrder() {
        return [
            body('status')
                .optional()
                .isIn(['pending', 'confirmed', 'serving', 'completed', 'cancelled'])
                .withMessage('Invalid status'),
        ];
    }

    // POST /api/orders
    static async createOrder(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const {
                orderType,
                tableId,
                reservationId,
                userId,
                deliveryAddress,
                deliveryNote,
                customerName,
                customerPhone,
            } = req.body;

            const order = await Order.create({
                orderType: orderType || 'dine-in', // default
                tableId: tableId ?? null,
                reservationId: reservationId ?? null,
                userId: userId ?? null,
                deliveryAddress: deliveryAddress ?? null,
                deliveryNote: deliveryNote ?? null,
                customerName: customerName ?? null,
                customerPhone: customerPhone ?? null,
                status: 'pending',
                total: 0,
            });

            res.status(201).json(order);
        } catch (error) {
            console.error('createOrder error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/orders
    static async getAllOrders(req, res) {
        try {
            const {
                orderType,
                tableId,
                reservationId,
                userId,
                status,
            } = req.query;

            const where = {};

            if (orderType) where.orderType = orderType;
            if (tableId) where.tableId = tableId;
            if (reservationId) where.reservationId = reservationId;
            if (userId) where.userId = userId;
            if (status) where.status = status;

            const orders = await Order.findAll({
                where,
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            res.json(orders);
        } catch (error) {
            console.error('getAllOrders error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/orders/:id
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id, {
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                    },
                ],
            });

            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            res.json(order);
        } catch (error) {
            console.error('getOrderById error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/orders/:id
    static async updateOrder(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            await order.update({ status });
            res.json(order);
        } catch (error) {
            console.error('updateOrder error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/orders/:id
    static async deleteOrder(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            await order.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('deleteOrder error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = OrderController;

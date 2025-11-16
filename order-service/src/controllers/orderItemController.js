// src/controllers/orderItemController.js
const { body, validationResult } = require('express-validator');
const OrderItem = require('../models/orderItem');
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');

class OrderItemController {
    // Validator cho tạo mới OrderItem
    static validateCreateOrderItem() {
        return [
            body('menuItemId')
                .isInt({ min: 1 })
                .withMessage('Menu Item ID must be a positive integer'),
            body('quantity')
                .isInt({ min: 1 })
                .withMessage('Quantity must be a positive integer'),
            body('price')
                .isFloat({ min: 0 })
                .withMessage('Price must be a positive number'),
        ];
    }

    // Validator cho update OrderItem (chỉ sửa quantity)
    static validateUpdateOrderItem() {
        return [
            body('quantity')
                .isInt({ min: 1 })
                .withMessage('Quantity must be a positive integer'),
        ];
    }

    // POST /api/orders-items/:orderId/items
    static async createOrderItem(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId } = req.params;
            const { menuItemId, quantity, price } = req.body;

            // Kiểm tra order tồn tại
            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Kiểm tra món có tồn tại không
            const menuItem = await MenuItem.findByPk(menuItemId);
            if (!menuItem) {
                return res.status(404).json({ error: 'Menu item not found' });
            }

            const orderItem = await OrderItem.create({
                orderId,
                menuItemId,
                quantity,
                price,
            });

            const total = await OrderItemController.recalcOrderTotal(orderId);

            res.status(201).json(orderItem, total);
        } catch (error) {
            console.error('createOrderItem error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/orders-items/:orderId/items/:itemId
    static async updateOrderItem(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId, itemId } = req.params;
            const { quantity } = req.body;

            const orderItem = await OrderItem.findOne({
                where: { id: itemId, orderId },
            });

            if (!orderItem) {
                return res.status(404).json({ error: 'Order item not found' });
            }

            await orderItem.update({ quantity });
            const total = await OrderItemController.recalcOrderTotal(orderId);

            res.json(orderItem, total);
        } catch (error) {
            console.error('updateOrderItem error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/orders-items/:orderId/items/:itemId
    static async deleteOrderItem(req, res) {
        try {
            const { orderId, itemId } = req.params;

            const orderItem = await OrderItem.findOne({
                where: { id: itemId, orderId },
            });

            if (!orderItem) {
                return res.status(404).json({ error: 'Order item not found' });
            }

            await orderItem.destroy();
            const total = await OrderItemController.recalcOrderTotal(orderId);

            res.status(204).send();
        } catch (error) {
            console.error('deleteOrderItem error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async recalcOrderTotal(orderId) {
        const items = await OrderItem.findAll({
            where: { orderId }
        });

        const total = items.reduce((sum, item) => {
            return sum + item.quantity * item.price;
        }, 0);

        await Order.update({ total }, { where: { id: orderId } });

        return total;
    }
}

module.exports = OrderItemController;

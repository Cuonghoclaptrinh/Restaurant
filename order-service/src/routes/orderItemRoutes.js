const express = require('express');
const router = express.Router();
const OrderItemController = require('../controllers/orderItemController');

router.post(
    '/:orderId/items',
    OrderItemController.validateCreateOrderItem(),
    OrderItemController.createOrderItem
);

router.put(
    '/:orderId/items/:itemId',
    OrderItemController.validateUpdateOrderItem(),
    OrderItemController.updateOrderItem
);

router.delete('/:orderId/items/:itemId', OrderItemController.deleteOrderItem);

module.exports = router;
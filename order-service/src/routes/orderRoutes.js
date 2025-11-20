const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const OrderItemController = require('../controllers/orderItemController');
const auth = require('../middleware/authMiddleware')

router.get('/', auth(['ADMIN']), OrderController.getAllOrders);
router.get('/:id', auth(['ADMIN']), OrderController.getOrderById);
router.post(
    '/', auth(['USER', 'ADMIN']),
    OrderController.validateCreateOrder(),
    OrderController.createOrder
);
router.put(
    '/:id', auth(['ADMIN']),
    OrderController.validateUpdateOrder(),
    OrderController.updateOrder
);
router.delete('/:id', auth(['ADMIN']), OrderController.deleteOrder);

router.post(
    '/:orderId/items',
    auth(['USER', 'ADMIN']),
    OrderItemController.validateCreateOrderItem(),
    OrderItemController.createOrderItem
);

router.put(
    '/:orderId/items/:itemId',
    auth(['USER', 'ADMIN']),
    OrderItemController.validateUpdateOrderItem(),
    OrderItemController.updateOrderItem
);

router.delete(
    '/:orderId/items/:itemId',
    auth(['USER', 'ADMIN']),
    OrderItemController.deleteOrderItem
);
module.exports = router;

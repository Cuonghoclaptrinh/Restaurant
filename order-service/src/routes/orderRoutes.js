const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');

router.get('/', OrderController.getAllOrders);
router.get('/:id', OrderController.getOrderById);
router.post(
    '/',
    OrderController.validateCreateOrder(),
    OrderController.createOrder
);
router.put(
    '/:id',
    OrderController.validateUpdateOrder(),
    OrderController.updateOrder
);
router.delete('/:id', OrderController.deleteOrder);

module.exports = router;

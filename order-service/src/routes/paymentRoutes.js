const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

router.get('/', PaymentController.getAllPayments);
router.post('/', PaymentController.validateCreatePayment(), PaymentController.createPayment);
router.put('/:id', PaymentController.validateUpdatePayment(), PaymentController.updatePayment);

module.exports = router;

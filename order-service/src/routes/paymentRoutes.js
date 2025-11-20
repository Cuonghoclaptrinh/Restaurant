const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

router.get('/payments', PaymentController.getAllPayments);
router.post('/payments', PaymentController.validateCreatePayment(), PaymentController.createPayment);
router.put('/payments/:id', PaymentController.validateUpdatePayment(), PaymentController.updatePayment);

module.exports = router;

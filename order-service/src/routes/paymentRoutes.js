const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

// Routes đã được mount với prefix '/payments' trong app.js, nên không cần prefix ở đây
router.get('/', PaymentController.getAllPayments);
router.post('/', PaymentController.validateCreatePayment(), PaymentController.createPayment);
router.put('/:id', PaymentController.validateUpdatePayment(), PaymentController.updatePayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const requireAuth = require('../middleware/auth');
const internalAuth = require('../middleware/internalAuth');

router.get('/me', requireAuth, cartController.getCartByUser);
router.post('/me/items', requireAuth, cartController.addItem);
router.put('/me/items/:id', requireAuth, cartController.updateItem);
router.delete('/me/items/:id', requireAuth, cartController.deleteItem);
router.put('/me/details', requireAuth, cartController.updateDetails);
router.post('/me/checkout', requireAuth, cartController.checkoutFromCart);
router.post('/system/create', internalAuth, cartController.ensureCartForUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const MenuItemController = require('../controllers/menuItemController');

router.get('/', MenuItemController.getAllMenuItems);
router.get('/:id', MenuItemController.getMenuItemById);
router.post('/', MenuItemController.validateMenuItem(), MenuItemController.createMenuItem);
router.put('/:id', MenuItemController.validateMenuItem(), MenuItemController.updateMenuItem);
router.delete('/:id', MenuItemController.deleteMenuItem);

module.exports = router;
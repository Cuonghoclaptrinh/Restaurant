const express = require('express');
const router = express.Router();
const MenuItemController = require('../controllers/menuItemController');

router.get('/menu-items', MenuItemController.getAllMenuItems);     
router.get('/menu-items/:id', MenuItemController.getMenuItemById);

router.post('/menu-items', MenuItemController.validateMenuItem(), MenuItemController.createMenuItem);
router.put('/menu-items/:id', MenuItemController.validateMenuItem(), MenuItemController.updateMenuItem);
router.delete('/menu-items/:id', MenuItemController.deleteMenuItem);

module.exports = router;
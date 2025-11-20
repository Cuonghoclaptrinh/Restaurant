
const express = require('express')
const router = express.Router()
const TableController = require('../controllers/tableController')
const auth = require('../middleware/authMiddleware')

// Admin xem danh sách bàn
router.get('/', TableController.getAll)

// Admin / service khác cập nhật trạng thái bàn
router.patch('/:id/status', TableController.updateStatus)

module.exports = router

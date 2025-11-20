// src/routes/userRoutes.js
const express = require('express')
const router = express.Router()
const { body } = require('express-validator')

const auth = require('../middleware/authMiddleware')
const UserController = require('../controllers/userController')

// Lấy danh sách user (ADMIN)
router.get(
    '/users',
    auth(['ADMIN']),
    UserController.getAllUsers
)

// Tạo user mới (ADMIN thêm nhân viên)
router.post(
    '/users',
    auth(['ADMIN']),
    [
        body('email').isEmail().withMessage('Email không hợp lệ'),
        body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
        body('name').notEmpty().withMessage('Tên không được để trống'),
        body('role').optional().isIn(['ADMIN', 'USER']).withMessage('Role không hợp lệ'),
    ],
    UserController.createUser
)

// Cập nhật user
router.put(
    '/users/:id',
    auth(['ADMIN']),
    [
        body('email').optional().isEmail().withMessage('Email không hợp lệ'),
        body('password').optional().isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
        body('role').optional().isIn(['ADMIN', 'USER']).withMessage('Role không hợp lệ'),
    ],
    UserController.updateUser
)

// Xóa user
router.delete(
    '/users/:id',
    auth(['ADMIN']),
    UserController.deleteUser
)

module.exports = router

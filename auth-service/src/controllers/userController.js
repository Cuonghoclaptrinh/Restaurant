// src/controllers/userController.js
const { User } = require('../models')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')

class UserController {
    // GET /auth/users
    static async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
                order: [['id', 'ASC']],
            })

            // Nếu muốn giống kiểu pagination các service khác:
            return res.json({
                data: users,
                pagination: {
                    total: users.length,
                    page: 1,
                    limit: users.length,
                    totalPages: 1,
                },
            })
            // Hoặc đơn giản: res.json(users)
        } catch (err) {
            console.error('getAllUsers error:', err)
            res.status(500).json({ message: err.message })
        }
    }

    // POST /auth/users
    static async createUser(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const { name, email, password, role = 'USER' } = req.body

            const existing = await User.findOne({ where: { email } })
            if (existing) {
                return res.status(400).json({ message: 'Email đã tồn tại' })
            }

            const hashed = await bcrypt.hash(password, 10)

            const user = await User.create({
                name,
                email,
                password: hashed,
                role,
            })

            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })
        } catch (err) {
            console.error('createUser error:', err)
            res.status(500).json({ message: err.message })
        }
    }

    // PUT /auth/users/:id
    static async updateUser(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const { id } = req.params
            const { name, email, password, role } = req.body

            const user = await User.findByPk(id)
            if (!user) {
                return res.status(404).json({ message: 'User không tồn tại' })
            }

            if (email && email !== user.email) {
                const existed = await User.findOne({ where: { email } })
                if (existed) {
                    return res.status(400).json({ message: 'Email đã được sử dụng' })
                }
                user.email = email
            }

            if (name) user.name = name
            if (role) user.role = role

            if (password) {
                const hashed = await bcrypt.hash(password, 10)
                user.password = hashed
            }

            await user.save()

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })
        } catch (err) {
            console.error('updateUser error:', err)
            res.status(500).json({ message: err.message })
        }
    }

    // DELETE /auth/users/:id
    static async deleteUser(req, res) {
        try {
            const { id } = req.params
            const deleted = await User.destroy({ where: { id } })
            if (!deleted) {
                return res.status(404).json({ message: 'User không tồn tại' })
            }
            res.status(204).send()
        } catch (err) {
            console.error('deleteUser error:', err)
            res.status(500).json({ message: err.message })
        }
    }
}

module.exports = UserController

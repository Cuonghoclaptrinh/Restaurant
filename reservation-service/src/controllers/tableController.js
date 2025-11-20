const { Table } = require('../models')

class TableController {
    // GET /tables
    static async getAll(req, res) {
        try {
            const tables = await Table.findAll({
                order: [['tableNumber', 'ASC']],
            })
            res.json(tables)
        } catch (err) {
            console.error('getAll tables error:', err)
            res.status(500).json({ error: err.message })
        }
    }

    // PATCH /tables/:id/status
    static async updateStatus(req, res) {
        try {
            const { id } = req.params
            const { status } = req.body

            const allowed = ['available', 'reserved', 'occupied', 'disabled']
            if (!allowed.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' })
            }

            const table = await Table.findByPk(id)
            if (!table) return res.status(404).json({ error: 'Table not found' })

            await table.update({ status })
            res.json(table)
        } catch (err) {
            console.error('update table status error:', err)
            res.status(500).json({ error: err.message })
        }
    }
}

module.exports = TableController
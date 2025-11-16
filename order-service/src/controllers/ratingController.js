const { body, validationResult } = require('express-validator');
const Rating = require('../models/rating');
const MenuItem = require('../models/menuItem');

class RatingController {
    static validateRating() {
        return [
            body('menuItemId').isInt({ min: 1 }).withMessage('Menu Item ID must be a positive integer'),
            body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
            body('comment').optional().isString().withMessage('Comment must be a string')
        ];
    }

    static async createRating(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { menuItemId, rating, comment } = req.body;
            const menuItem = await MenuItem.findByPk(menuItemId);
            if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

            const newRating = await Rating.create({ menuItemId, rating, comment });
            res.status(201).json(newRating);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getRatingsByMenuItem(req, res) {
        try {
            const { menuItemId } = req.params;
            const ratings = await Rating.findAll({ where: { menuItemId } });
            res.json(ratings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = RatingController;
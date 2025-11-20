// src/controllers/menuItemController.js
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const MenuItem = require('../models/menuItem');
const Rating = require('../models/rating');

// Để khỏi lặp lại chuỗi
const CATEGORY_LIST = ['breakfast', 'lunch', 'dinner', 'starters', 'appetizer'];
const TYPE_LIST = ['food', 'drink', 'dessert'];
const SORTABLE_FIELDS = ['price', 'createdAt', 'orderIndex'];

const sanitizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    );

class MenuItemController {
    // ----- Validate -----
    static validateMenuItem() {
        return [
            body('name').notEmpty().withMessage('Name is required'),
            body('price')
                .isFloat({ min: 0 })
                .withMessage('Price must be a positive number'),
            body('category')
                .notEmpty()
                .withMessage('Category is required')
                .isIn(CATEGORY_LIST)
                .withMessage(`Category must be one of: ${CATEGORY_LIST.join(', ')}`),
            body('type')
                .notEmpty()
                .withMessage('Type is required')
                .isIn(TYPE_LIST)
                .withMessage(`Type must be one of: ${TYPE_LIST.join(', ')}`),
            body('description')
                .optional()
                .isString()
                .withMessage('Description must be a string'),
            body('imageUrl')
                .optional()
                .isString()
                .withMessage('imageUrl must be a string'),
            body('badge')
                .optional()
                .isString()
                .withMessage('badge must be a string'),
            body('ctaLabel')
                .optional()
                .isString()
                .withMessage('ctaLabel must be a string'),
            body('orderIndex')
                .optional()
                .isInt()
                .withMessage('orderIndex must be an integer'),
            body('isFeatured')
                .optional()
                .isBoolean()
                .withMessage('isFeatured must be boolean'),
            body('sku')
                .optional()
                .isString()
                .withMessage('sku must be a string'),
            body('tags')
                .optional()
                .isArray()
                .withMessage('tags must be an array of strings')
                .bail()
                .custom((tags) => tags.every((tag) => typeof tag === 'string'))
                .withMessage('each tag must be a string'),
        ];
    }

    // ----- Create -----
    static async createMenuItem(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });

        try {
            const {
                name,
                price,
                category,
                type,
                description,
                imageUrl,
                badge,
                ctaLabel,
                orderIndex,
                isFeatured,
                sku,
                tags,
            } = req.body;
            const menuItem = await MenuItem.create(sanitizePayload({
                name,
                price,
                category,
                type,
                description,
                imageUrl,
                badge,
                ctaLabel,
                orderIndex,
                isFeatured,
                sku,
                tags,
            }));
            return res.status(201).json(menuItem);
        } catch (error) {
            console.error('Create menu item error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ----- Get list + filter + pagination -----
    static async getAllMenuItems(req, res) {
        try {
            const {
                query,     // search by name
                category,
                type,
                minPrice,
                maxPrice,
                page = 1,
                limit = 20,
                sortBy,
                sortDirection,
                isFeatured,
                excludeId,
            } = req.query;

            const where = {};

            if (query) {
                // tìm theo tên, không phân biệt hoa thường
                where.name = { [Op.iLike]: `%${query}%` };
            }

            if (category && CATEGORY_LIST.includes(category)) {
                where.category = category;
            }

            if (type && TYPE_LIST.includes(type)) {
                where.type = type;
            }

            if (typeof isFeatured !== 'undefined') {
                if (['true', 'false'].includes(String(isFeatured))) {
                    where.isFeatured = String(isFeatured) === 'true';
                }
            }

            if (minPrice || maxPrice) {
                where.price = {};
                if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
                if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
            }

            if (excludeId) {
                const excludeNum = Number(excludeId);
                if (Number.isInteger(excludeNum)) {
                    where.id = {
                        ...(where.id || {}),
                        [Op.ne]: excludeNum,
                    };
                }
            }

            const pageNum = Math.max(parseInt(page) || 1, 1);
            const pageSize = Math.max(parseInt(limit) || 20, 1);
            const offset = (pageNum - 1) * pageSize;

            const normalizedSortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'orderIndex';
            const normalizedDirection = String(sortDirection).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            const { rows, count } = await MenuItem.findAndCountAll({
                where,
                offset,
                limit: pageSize,
                order: [
                    [normalizedSortField, normalizedDirection],
                    ['createdAt', 'DESC'],
                ],
            });

            return res.json({
                data: rows,
                pagination: {
                    total: count,
                    page: pageNum,
                    limit: pageSize,
                    totalPages: Math.ceil(count / pageSize),
                },
            });
        } catch (error) {
            console.error('Get all menu items error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ----- Get detail + ratings -----
    static async getMenuItemById(req, res) {
        try {
            const { id } = req.params;
            const idNum = Number(id);
            if (!Number.isInteger(idNum) || idNum <= 0) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const menuItem = await MenuItem.findByPk(idNum, {
                include: [
                    {
                        model: Rating,
                        as: 'ratings', // 👈 phải khớp alias trong association
                        attributes: ['id', 'rating', 'comment', 'createdAt'],
                    },
                ],
            });

            if (!menuItem) {
                return res.status(404).json({ error: 'Menu item not found' });
            }

            const ratings = menuItem.ratings || [];
            const averageRating =
                ratings.length > 0
                    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                    : 0;

            return res.json({
                ...menuItem.toJSON(),
                averageRating,
            });
        } catch (error) {
            console.error('Error in getMenuItemById:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ----- Update -----
    static async updateMenuItem(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = req.params;
            const idNum = Number(id);
            if (!Number.isInteger(idNum) || idNum <= 0) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const menuItem = await MenuItem.findByPk(idNum);
            if (!menuItem) {
                return res.status(404).json({ error: 'Menu item not found' });
            }

            const {
                name,
                price,
                category,
                type,
                description,
                imageUrl,
                badge,
                ctaLabel,
                orderIndex,
                isFeatured,
                sku,
                tags,
            } = req.body;
            await menuItem.update(sanitizePayload({
                name,
                price,
                category,
                type,
                description,
                imageUrl,
                badge,
                ctaLabel,
                orderIndex,
                isFeatured,
                sku,
                tags,
            }));

            return res.json(menuItem);
        } catch (error) {
            console.error('Update menu item error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ----- Delete -----
    static async deleteMenuItem(req, res) {
        try {
            const { id } = req.params;
            const idNum = Number(id);
            if (!Number.isInteger(idNum) || idNum <= 0) {
                return res.status(400).json({ error: 'Invalid ID format' });
            }

            const menuItem = await MenuItem.findByPk(idNum);
            if (!menuItem) {
                return res.status(404).json({ error: 'Menu item not found' });
            }

            await menuItem.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error('Delete menu item error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MenuItemController;

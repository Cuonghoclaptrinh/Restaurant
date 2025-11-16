// src/models/index.js
const sequelize = require('../config/database');

const MenuItem = require('./menuItem');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Payment = require('./payment');
const Rating = require('./rating');

// ========== Associations ==========

// Order 1 - N OrderItem
Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items',
    onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
});

// MenuItem 1 - N OrderItem
MenuItem.hasMany(OrderItem, {
    foreignKey: 'menuItemId',
    as: 'orderItems',
});
OrderItem.belongsTo(MenuItem, {
    foreignKey: 'menuItemId',
    as: 'menuItem',
});

// Order 1 - 1 Payment
Order.hasOne(Payment, {
    foreignKey: 'orderId',
    as: 'payment',
    onDelete: 'SET NULL',
});
Payment.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
});

// MenuItem 1 - N Rating
MenuItem.hasMany(Rating, {
    foreignKey: 'menuItemId',
    as: 'ratings',
});
Rating.belongsTo(MenuItem, {
    foreignKey: 'menuItemId',
    as: 'menuItem',
});

// Xuất ra cho chỗ khác dùng
module.exports = {
    sequelize,
    MenuItem,
    Order,
    OrderItem,
    Payment,
    Rating,
};

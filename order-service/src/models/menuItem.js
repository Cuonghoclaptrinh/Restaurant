const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('food', 'drink', 'dessert'),
        allowNull: false,
        defaultValue: 'food'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    badge: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ctaLabel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Đặt món ngay',
    },
    orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'menu_items',
    timestamps: true
});

module.exports = MenuItem;
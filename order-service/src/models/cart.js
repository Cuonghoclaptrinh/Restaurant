const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active'
    },
    orderType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'delivery'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deliveryNote: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'carts',
    timestamps: true
});

module.exports = Cart;
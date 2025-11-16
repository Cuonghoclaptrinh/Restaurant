// src/models/order.js
'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Order extends Model { }

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Kiểu đơn: ăn tại chỗ / giao hàng
    orderType: {
      type: DataTypes.ENUM('dine-in', 'delivery'),
      allowNull: false,
      defaultValue: 'dine-in',
    },

    // Dùng cho dine-in (bàn trong nhà hàng) – delivery có thể null
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Nếu đơn này sinh ra từ reservation-service thì lưu reservationId
    reservationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Liên kết sang user bên auth-service (theo id user)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // dine-in ở nhà hàng có thể không login
    },

    // Thông tin giao hàng (snapshot)
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryNote: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Tổng tiền
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Trạng thái đơn
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'serving',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    schema: 'public',
    timestamps: true,
    indexes: [
      { fields: ['orderType'] },
      { fields: ['tableId'] },
      { fields: ['reservationId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Order;

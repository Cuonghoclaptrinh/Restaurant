'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Table extends Model {
        static associate(models) {
            if (models.Reservation) {
                Table.hasMany(models.Reservation, {
                    foreignKey: 'tableId',
                    as: 'reservations',
                });
            }
        }
    }

    Table.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            tableNumber: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true,
            },
            capacity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            zone: {
                type: DataTypes.STRING,
                defaultValue: 'indoor',
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'available',
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
            modelName: 'Table',
            tableName: 'Tables',
            timestamps: true,
        }
    );

    return Table;
};

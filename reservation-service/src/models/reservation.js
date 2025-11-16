'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Reservation extends Model {
        static associate(models) {
            Reservation.belongsTo(models.Table, {
                foreignKey: 'tableId',
                as: 'table'
            });
        }
    }

    Reservation.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            customerName: DataTypes.STRING,
            customerPhone: DataTypes.STRING,

            tableId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            partySize: DataTypes.INTEGER,

            startTime: DataTypes.DATE,
            endTime: DataTypes.DATE,

            status: {
                type: DataTypes.STRING,
                defaultValue: 'pending'
            },

            notes: DataTypes.TEXT
        },
        {
            sequelize,
            modelName: 'Reservation',
            tableName: 'Reservations'
        }
    );

    return Reservation;
};

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MenuItem = require('./menuItem');

class Rating extends Model { }

Rating.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        menuItemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: MenuItem,
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'Rating',
        tableName: 'ratings',
        timestamps: true
    }
);

module.exports = Rating;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const UserProfile = sequelize.define('UserProfile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // mỗi user 1 profile
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Vietnam',
    },
}, {
    tableName: 'user_profiles',
    timestamps: true,
});

User.hasOne(UserProfile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE',
});
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = UserProfile;

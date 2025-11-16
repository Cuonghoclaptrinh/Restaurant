const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgres://postgres:password@postgres_db:5432/restaurant_db',
    {
        dialect: 'postgres',
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
        },
    }
);

module.exports = sequelize;
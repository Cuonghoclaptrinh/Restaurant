// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//     dialect: 'postgres',
//     logging: false,
//     dialectOptions: {
//         ssl: false
//     }
// });

// module.exports = sequelize;



// src/config/database.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const env = process.env.NODE_ENV || 'development';

let sequelize;

if (env === 'test') {
    // 👉 DB dùng cho Jest
    const testUrl =
        process.env.TEST_DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/restaurant_test';

    sequelize = new Sequelize(testUrl, {
        dialect: 'postgres',
        logging: false,
    });
} else {
    // 👉 DB dev/prod như cũ
    const dbUrl =
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/reservationdb';

    sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: false,
        },
    });
}

module.exports = sequelize;

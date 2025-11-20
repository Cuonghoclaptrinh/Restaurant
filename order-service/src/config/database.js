// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   logging: console.log,
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// });

// module.exports = sequelize;

// src/config/database.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const env = process.env.NODE_ENV || 'development';

let sequelize;

if (env === 'test') {
  // 👉 Kết nối DB test khi chạy Jest
  const testUrl =
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/restaurant_test';

  sequelize = new Sequelize(testUrl, {
    dialect: 'postgres',
    logging: false, // tắt log cho đỡ rối khi test
  });
} else {
  // 👉 Kết nối DB dev/prod bình thường
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/orderdb';

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

module.exports = sequelize;

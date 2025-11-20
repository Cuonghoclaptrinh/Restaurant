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

// module.exports = sequelize;

// const { Sequelize } = require('sequelize');

// const env = process.env.NODE_ENV || 'development';

// let sequelize;

// if (env === 'test') {
//     sequelize = new Sequelize(
//         'restaurant_test',   // DB vừa tạo
//         'postgres',          // POSTGRES_USER
//         'postgres',          // POSTGRES_PASSWORD
//         {
//             host: 'localhost', // vì Jest chạy trên máy host
//             port: 5432,        // port map trong docker-compose
//             dialect: 'postgres',
//             logging: false,
//         }
//     );
// } else {
//     sequelize = new Sequelize(
//         process.env.DB_NAME,
//         process.env.DB_USER,
//         process.env.DB_PASSWORD,
//         {
//             host: process.env.DB_HOST || 'postgres_db',
//             port: process.env.DB_PORT || 5432,
//             dialect: 'postgres',
//         }
//     );
// }

module.exports = sequelize;

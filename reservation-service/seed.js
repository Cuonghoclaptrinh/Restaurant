// reservation-service/seed.js
require('dotenv').config();
const db = require('./src/models'); // <-- models/index.js
const { Table } = db;

const seedTables = async () => {
    try {
        await db.sequelize.authenticate();
        console.log("DB connected. Seeding...");

        // DỮ LIỆU MẪU
        const tables = [
            { tableNumber: '1', capacity: 2, zone: 'indoor', status: 'available' },
            { tableNumber: '2', capacity: 4, zone: 'indoor', status: 'available' },
            { tableNumber: '3', capacity: 6, zone: 'indoor', status: 'available' },
            { tableNumber: '4', capacity: 4, zone: 'vip', status: 'available' },
            { tableNumber: '5', capacity: 8, zone: 'outdoor', status: 'available' },
        ];

        // XÓA BẢNG CŨ (nếu cần)
        await Table.destroy({ where: {}, truncate: true });

        // THÊM DỮ LIỆU
        await Table.bulkCreate(tables);

        console.log("Seeding completed!");
        process.exit(0);

    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};

seedTables();

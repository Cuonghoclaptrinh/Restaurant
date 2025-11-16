'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        // TABLES
        await queryInterface.createTable('Tables', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            tableNumber: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true
            },
            capacity: Sequelize.INTEGER,
            zone: Sequelize.STRING,
            status: {
                type: Sequelize.STRING,
                defaultValue: 'available'
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // RESERVATIONS
        await queryInterface.createTable('Reservations', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            customerName: Sequelize.STRING,
            customerPhone: Sequelize.STRING,

            tableId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },

            partySize: Sequelize.INTEGER,
            startTime: Sequelize.DATE,
            endTime: Sequelize.DATE,

            status: {
                type: Sequelize.STRING,
                defaultValue: 'pending'
            },

            notes: Sequelize.TEXT,

            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // FK
        await queryInterface.addConstraint('Reservations', {
            fields: ['tableId'],
            type: 'foreign key',
            name: 'fk_reservation_table_id',
            references: {
                table: 'Tables',
                field: 'id'
            },
            onDelete: 'CASCADE'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeConstraint('Reservations', 'fk_reservation_table_id');
        await queryInterface.dropTable('Reservations');
        await queryInterface.dropTable('Tables');
    }
};

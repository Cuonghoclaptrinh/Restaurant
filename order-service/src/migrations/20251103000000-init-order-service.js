// order-service/migrations/20251103000000-init-order-service.js
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. TẠO BẢNG menu_items
        await queryInterface.createTable('menu_items', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            price: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            category: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('food', 'drink', 'dessert'),
                allowNull: false,
                defaultValue: 'food',
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });

        // 2. TẠO BẢNG orders
        await queryInterface.createTable('orders', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            orderType: {
                type: Sequelize.ENUM('dine-in', 'delivery'),
                allowNull: false,
                defaultValue: 'dine-in',
            },

            tableId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },

            reservationId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },

            userId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },

            deliveryAddress: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            deliveryNote: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            customerName: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            customerPhone: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            total: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },

            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'confirmed',
                    'serving',
                    'completed',
                    'cancelled'
                ),
                allowNull: false,
                defaultValue: 'pending',
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('now'),
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('now'),
            },
        });

        // Index cho các truy vấn lọc (dùng addIndex, không cần raw SQL nữa)
        await queryInterface.addIndex('orders', ['orderType'], {
            name: 'orders_order_type',
        });
        await queryInterface.addIndex('orders', ['tableId'], {
            name: 'orders_table_id',
        });
        await queryInterface.addIndex('orders', ['reservationId'], {
            name: 'orders_reservation_id',
        });
        await queryInterface.addIndex('orders', ['userId'], {
            name: 'orders_user_id',
        });
        await queryInterface.addIndex('orders', ['status'], {
            name: 'orders_status',
        });
        await queryInterface.addIndex('orders', ['createdAt'], {
            name: 'orders_created_at',
        });

        // 3. TẠO BẢNG order_items
        await queryInterface.createTable('order_items', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            orderId: {
                type: Sequelize.INTEGER, 
                allowNull: false,
            },
            menuItemId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            price: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
        });

        // 4. TẠO BẢNG payments
        await queryInterface.createTable('payments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            orderId: {
                type: Sequelize.INTEGER,
                allowNull: true, 
                unique: true,
            },
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            method: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'pending',
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });

        // 5. TẠO BẢNG ratings
        await queryInterface.createTable('ratings', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            menuItemId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            comment: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });

        // === TẠO FOREIGN KEY ===
        await queryInterface.addConstraint('order_items', {
            fields: ['orderId'],
            type: 'foreign key',
            name: 'fk_orderitems_orderid',
            references: {
                table: 'orders',
                field: 'id',
            },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint('order_items', {
            fields: ['menuItemId'],
            type: 'foreign key',
            name: 'fk_orderitems_menuitemid',
            references: {
                table: 'menu_items',
                field: 'id',
            },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint('payments', {
            fields: ['orderId'],
            type: 'foreign key',
            name: 'fk_payments_orderid',
            references: {
                table: 'orders',
                field: 'id',
            },
            onDelete: 'SET NULL',
        });

        await queryInterface.addConstraint('ratings', {
            fields: ['menuItemId'],
            type: 'foreign key',
            name: 'fk_ratings_menuitemid',
            references: {
                table: 'menu_items',
                field: 'id',
            },
            onDelete: 'CASCADE',
        });
    },

    async down(queryInterface, Sequelize) {
        // XÓA CONSTRAINT TRƯỚC
        await queryInterface.removeConstraint('order_items', 'fk_orderitems_orderid');
        await queryInterface.removeConstraint('order_items', 'fk_orderitems_menuitemid');
        await queryInterface.removeConstraint('payments', 'fk_payments_orderid');
        await queryInterface.removeConstraint('ratings', 'fk_ratings_menuitemid');

        // XÓA INDEX orders
        await queryInterface.removeIndex('orders', 'orders_order_type');
        await queryInterface.removeIndex('orders', 'orders_table_id');
        await queryInterface.removeIndex('orders', 'orders_reservation_id');
        await queryInterface.removeIndex('orders', 'orders_user_id');
        await queryInterface.removeIndex('orders', 'orders_status');
        await queryInterface.removeIndex('orders', 'orders_created_at');

        // XÓA BẢNG
        await queryInterface.dropTable('ratings');
        await queryInterface.dropTable('payments');
        await queryInterface.dropTable('order_items');
        await queryInterface.dropTable('orders');
        await queryInterface.dropTable('menu_items');

        // XÓA ENUM (tên type do Sequelize tạo)
        await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_menu_items_type";
      DROP TYPE IF EXISTS "enum_orders_orderType";
      DROP TYPE IF EXISTS "enum_orders_status";
    `);
    },
};

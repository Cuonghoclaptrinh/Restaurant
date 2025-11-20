'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // await queryInterface.addColumn('menu_items', 'imageUrl', {
        //     type: Sequelize.STRING,
        //     allowNull: true,
        // });

        await queryInterface.addColumn('menu_items', 'badge', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('menu_items', 'ctaLabel', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Đặt món ngay',
        });

        await queryInterface.addColumn('menu_items', 'orderIndex', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn('menu_items', 'isFeatured', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface/*, Sequelize*/) {
        // await queryInterface.removeColumn('menu_items', 'imageUrl');
        await queryInterface.removeColumn('menu_items', 'badge');
        await queryInterface.removeColumn('menu_items', 'ctaLabel');
        await queryInterface.removeColumn('menu_items', 'orderIndex');
        await queryInterface.removeColumn('menu_items', 'isFeatured');
    },
};







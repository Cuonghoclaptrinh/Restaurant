'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('menu_items', 'sku', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('menu_items', 'tags', {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false,
            defaultValue: [],
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('menu_items', 'sku');
        await queryInterface.removeColumn('menu_items', 'tags');
    },
};







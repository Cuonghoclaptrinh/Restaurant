'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('carts', 'orderType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'delivery'
    });

    await queryInterface.addColumn('carts', 'customerName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('carts', 'customerPhone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('carts', 'deliveryAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('carts', 'deliveryNote', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('carts', 'deliveryNote');
    await queryInterface.removeColumn('carts', 'deliveryAddress');
    await queryInterface.removeColumn('carts', 'customerPhone');
    await queryInterface.removeColumn('carts', 'customerName');
    await queryInterface.removeColumn('carts', 'orderType');
  }
};
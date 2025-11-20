'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      cartId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      menuItemId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Foreign Key: cart_items.cartId -> carts.id
    await queryInterface.addConstraint('cart_items', {
      fields: ['cartId'],
      type: 'foreign key',
      name: 'fk_cart_items_cart_id',
      references: {
        table: 'carts',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Foreign Key: cart_items.menuItemId -> menu_items.id (optional but recommended)
    await queryInterface.addConstraint('cart_items', {
      fields: ['menuItemId'],
      type: 'foreign key',
      name: 'fk_cart_items_menu_item_id',
      references: {
        table: 'menu_items',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('cart_items', 'fk_cart_items_menu_item_id');
    await queryInterface.removeConstraint('cart_items', 'fk_cart_items_cart_id');
    await queryInterface.dropTable('cart_items');
  }
};
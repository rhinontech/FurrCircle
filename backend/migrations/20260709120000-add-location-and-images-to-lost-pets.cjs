'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('lost_pets', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
    });
    await queryInterface.addColumn('lost_pets', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
    });
    await queryInterface.addColumn('lost_pets', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('lost_pets', 'latitude');
    await queryInterface.removeColumn('lost_pets', 'longitude');
    await queryInterface.removeColumn('lost_pets', 'images');
  }
};

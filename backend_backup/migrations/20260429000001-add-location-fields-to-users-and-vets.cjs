'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add latitude and longitude to users table
    await queryInterface.addColumn('users', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    // Add latitude and longitude to vets table
    await queryInterface.addColumn('vets', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('vets', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove from users
    await queryInterface.removeColumn('users', 'latitude');
    await queryInterface.removeColumn('users', 'longitude');

    // Remove from vets
    await queryInterface.removeColumn('vets', 'latitude');
    await queryInterface.removeColumn('vets', 'longitude');
  }
};

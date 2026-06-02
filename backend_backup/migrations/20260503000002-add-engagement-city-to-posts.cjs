'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'engagementScore', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('posts', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('posts', 'engagementScore');
    await queryInterface.removeColumn('posts', 'city');
  },
};

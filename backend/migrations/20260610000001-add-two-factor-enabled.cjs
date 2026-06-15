'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('users');
    if (!tableDesc.twoFactorEnabled) {
      await queryInterface.addColumn('users', 'twoFactorEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'twoFactorEnabled');
  },
};

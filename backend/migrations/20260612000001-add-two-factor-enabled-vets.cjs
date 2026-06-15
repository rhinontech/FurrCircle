'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('vets');
    if (!tableDesc.twoFactorEnabled) {
      await queryInterface.addColumn('vets', 'twoFactorEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('vets', 'twoFactorEnabled');
  },
};

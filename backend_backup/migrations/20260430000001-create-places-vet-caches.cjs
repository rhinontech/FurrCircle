'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('places_vet_caches', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cityNormalized: {
        type: Sequelize.STRING,
        allowNull: false
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: Sequelize.literal(`'[]'::jsonb`)
      },
      fetchedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('places_vet_caches', ['cityNormalized'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('places_vet_caches');
  }
};


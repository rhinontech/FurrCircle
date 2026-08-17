'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      pet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      appetite: {
        type: Sequelize.STRING,
        allowNull: false
      },
      water_intake: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mood: {
        type: Sequelize.STRING,
        allowNull: false
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

    // Add a unique index on (pet_id, date) to ensure a pet has at most one log per day
    await queryInterface.addIndex('daily_logs', ['pet_id', 'date'], {
      unique: true,
      name: 'daily_logs_pet_id_date_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_logs');
  }
};

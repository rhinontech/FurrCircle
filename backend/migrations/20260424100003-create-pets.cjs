'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pets', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      profile_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      species: {
        type: Sequelize.STRING,
        allowNull: false
      },
      breed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      weight: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      history: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_adoption_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_foster_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      age: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      microchip_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      healthStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Healthy'
      },
      adoption_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      foster_fee_per_day: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      foster_provides: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      personality: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pets');
  }
};

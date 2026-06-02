'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('adoption_applications', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      petId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      applicantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "adoption"
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      applicantName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      applicantEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      applicantPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      applicantCity: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ownerNotes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('adoption_applications');
  }
};

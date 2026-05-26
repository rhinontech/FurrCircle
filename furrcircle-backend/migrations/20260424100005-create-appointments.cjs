'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appointments', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      vet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        allowNull: true
      },
      time: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      proposedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      proposedTime: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rescheduleRequestedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rescheduleReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ownerFeedbackRating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ownerFeedbackTags: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ownerFeedbackComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ownerFeedbackSubmittedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      vetFeedbackRating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      vetFeedbackTags: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      vetFeedbackComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vetFeedbackSubmittedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('appointments');
  }
};

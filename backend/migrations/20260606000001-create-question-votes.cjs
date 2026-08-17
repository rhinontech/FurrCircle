'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('question_votes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      questionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'questions', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Ensure one vote per user per question
    await queryInterface.addIndex('question_votes', ['questionId', 'userId'], {
      unique: true,
      name: 'question_votes_question_user_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('question_votes');
  },
};

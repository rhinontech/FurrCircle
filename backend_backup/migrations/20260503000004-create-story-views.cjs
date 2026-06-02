'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('story_views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      storyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'stories', key: 'id' },
        onDelete: 'CASCADE',
      },
      viewerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      viewerType: {
        type: Sequelize.ENUM('user', 'vet'),
        allowNull: false,
        defaultValue: 'user',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('story_views', ['storyId', 'viewerId', 'viewerType'], {
      unique: true,
      name: 'story_views_unique_viewer',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('story_views');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_story_views_viewerType";');
  },
};

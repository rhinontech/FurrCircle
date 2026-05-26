'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      userType: {
        type: Sequelize.ENUM('user', 'vet'),
        allowNull: false,
        defaultValue: 'user',
      },
      mediaUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mediaType: {
        type: Sequelize.ENUM('image', 'video'),
        allowNull: false,
        defaultValue: 'image',
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      viewCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_stories_userType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_stories_mediaType";');
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add isPrivate column to users table
    await queryInterface.addColumn('users', 'isPrivate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // 2. Create follows table
    await queryInterface.createTable('follows', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      followerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      followingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'accepted',
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

    // Ensure unique follow relationships (a user can only follow another user once)
    await queryInterface.addConstraint('follows', {
      fields: ['followerId', 'followingId'],
      type: 'unique',
      name: 'unique_follow',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('follows');
    await queryInterface.removeColumn('users', 'isPrivate');
    // Also drop the ENUM type created by Sequelize for the status column
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_follows_status";');
  }
};

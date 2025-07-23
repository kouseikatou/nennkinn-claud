'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('family_members', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      memberType: {
        type: Sequelize.ENUM('spouse', 'child'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      nameKana: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      myNumber: {
        type: Sequelize.STRING(12)
      },
      basicPensionNumber: {
        type: Sequelize.STRING(10)
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index for faster queries
    await queryInterface.addIndex('family_members', ['applicationId']);
    await queryInterface.addIndex('family_members', ['memberType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('family_members');
  }
};
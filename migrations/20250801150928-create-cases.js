'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cases', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false
      },
      etiologia: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tejido: {
        type: Sequelize.STRING,
        allowNull: true
      },
      diagnostico: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tratamiento: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phase: {
        type: Sequelize.ENUM('pre', 'intra', 'post'),
        allowNull: true
      },
      optionalDNI: {
        type: Sequelize.STRING,
        allowNull: true
      },
      uploadedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('cases');
  }
};

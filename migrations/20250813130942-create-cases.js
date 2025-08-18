'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cases', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patient_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      dni: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      region:       { type: Sequelize.STRING(100), allowNull: true },
      etiologia:    { type: Sequelize.STRING(150), allowNull: true },
      tejido:       { type: Sequelize.STRING(150), allowNull: true },
      diagnostico:  { type: Sequelize.STRING(200), allowNull: true },
      tratamiento:  { type: Sequelize.STRING(200), allowNull: true },
      estado:       { type: Sequelize.STRING(50),  allowNull: true },
      uploaded_by:  { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('cases', ['patient_id']);
    await queryInterface.addIndex('cases', ['estado']);
    await queryInterface.addIndex('cases', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cases');
  }
};
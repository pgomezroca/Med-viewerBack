const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Case = sequelize.define('Case', {
    dni: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    etiologia: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    tejido: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    diagnostico: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    tratamiento: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'abierto'
    },
    uploaded_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  }, {
    tableName: 'cases',
    timestamps: true,
    underscored: true,
  });

  Case.associate = (models) => {
    Case.belongsTo(models.Patient, {
      foreignKey: 'patient_id',
      as: 'patient',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Case.hasMany(models.Image, {
      foreignKey: 'case_id',
      as: 'images',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Case.belongsTo(models.User, {
      foreignKey: 'uploaded_by',
      as: 'uploader',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return Case;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Case = sequelize.define('Case', {
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    etiologia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tejido: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diagnostico: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tratamiento: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phase: {
      type: DataTypes.ENUM('pre', 'intra', 'post'),
      allowNull: true,
    },
    optionalDNI: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'cases',
    timestamps: true,
  });

  // Relaciones
  Case.associate = (models) => {
    Case.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader',
    });
  };

  return Case;
};
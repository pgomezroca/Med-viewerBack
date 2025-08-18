const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    dni: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  }, {
    tableName: 'patients',
    timestamps: true,
    underscored: true,
  });

  Patient.associate = (models) => {
    Patient.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Patient.hasMany(models.Case, {
      foreignKey: 'patient_id',
      as: 'cases',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Patient;
};
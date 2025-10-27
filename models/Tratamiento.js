module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Tratamiento = sequelize.define('Tratamiento', {
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'tratamientos',
    timestamps: true,
    underscored: true
  });

  Tratamiento.associate = (models) => {
    Tratamiento.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Tratamiento.belongsTo(models.Diagnostico, {
      foreignKey: 'diagnostico_id',
      as: 'diagnostico',
      onDelete: 'CASCADE'
    });
  };

  return Tratamiento;
};

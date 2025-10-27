module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Diagnostico = sequelize.define('Diagnostico', {
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'diagnosticos',
    timestamps: true,
    underscored: true
  });

  Diagnostico.associate = (models) => {
    Diagnostico.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Diagnostico.belongsTo(models.Tejido, {
      foreignKey: 'tejido_id',
      as: 'tejido',
      onDelete: 'CASCADE'
    });

    Diagnostico.hasMany(models.Tratamiento, {
      foreignKey: 'diagnostico_id',
      as: 'tratamientos',
      onDelete: 'CASCADE'
    });
  };

  return Diagnostico;
};

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Tejido = sequelize.define('Tejido', {
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'tejidos',
    timestamps: true,
    underscored: true
  });

  Tejido.associate = (models) => {
    Tejido.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Tejido.belongsTo(models.Etiologia, {
      foreignKey: 'etiologia_id',
      as: 'etiologia',
      onDelete: 'CASCADE'
    });

    Tejido.hasMany(models.Diagnostico, {
      foreignKey: 'tejido_id',
      as: 'diagnosticos',
      onDelete: 'CASCADE'
    });
  };

  return Tejido;
};

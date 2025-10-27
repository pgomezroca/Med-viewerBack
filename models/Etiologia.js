module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Etiologia = sequelize.define('Etiologia', {
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'etiologias',
    timestamps: true,
    underscored: true
  });

  Etiologia.associate = (models) => {
    Etiologia.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Etiologia.belongsTo(models.Region, {
      foreignKey: 'region_id',
      as: 'region',
      onDelete: 'CASCADE'
    });

    Etiologia.hasMany(models.Tejido, {
      foreignKey: 'etiologia_id',
      as: 'tejidos',
      onDelete: 'CASCADE'
    });
  };

  return Etiologia;
};

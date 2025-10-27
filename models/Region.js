module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Region = sequelize.define('Region', {
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'regiones',
    timestamps: true,
    underscored: true
  });

  Region.associate = (models) => {
    Region.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Region.hasMany(models.Etiologia, {
      foreignKey: 'region_id',
      as: 'etiologias',
      onDelete: 'CASCADE'
    });
  };

  return Region;
};

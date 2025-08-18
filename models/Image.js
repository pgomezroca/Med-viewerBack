const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Image = sequelize.define('Image', {
    case_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PatientCases",
        key: "id",
      },
      field: "case_id",
      onDelete: "CASCADE",
    },
    url: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    fase: {
      type: DataTypes.ENUM('pre', 'intra', 'post'),
      allowNull: true,
      defaultValue: 'pre'
    },
  }, {
    tableName: 'images',
    timestamps: true,
    underscored: true,
  });

  Image.associate = (models) => {
    Image.belongsTo(models.Case, {
      foreignKey: 'case_id',
      as: 'case',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Image;
};

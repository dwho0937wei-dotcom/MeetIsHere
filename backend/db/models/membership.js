'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Membership.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users'
      },
      onDelete: 'CASCADE'
    },
    groupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups'
      },
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('pending', 'member', 'co-host', 'host'),
      allowNull: false,
      validate: {
        isIn: [['pending', 'member', 'co-host', 'host']]
      }
    }
  }, {
    sequelize,
    modelName: 'Membership',
  });
  return Membership;
};
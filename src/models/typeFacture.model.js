const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TypeFacture = sequelize.define('TypeFacture', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  libelle: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'type_factures',
  timestamps: true
});

module.exports = TypeFacture;

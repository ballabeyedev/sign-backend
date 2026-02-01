const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentItem = sequelize.define('DocumentItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  prix_unitaire: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
        model: 'documents',
        key: 'id'
    }
    }

}, {
  tableName: 'document_items',
  timestamps: true
});

module.exports = DocumentItem;

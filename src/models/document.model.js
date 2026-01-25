const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_facture: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  typeFactureId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  delais_execution: {
    type: DataTypes.STRING
  },
  date_execution: {
    type: DataTypes.DATE
  },
  avance: {
    type: DataTypes.FLOAT,
    validate: { min: 0 }
  },
  lieu_execution: {
    type: DataTypes.STRING
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  moyen_paiement: {
    type: DataTypes.ENUM('CASH', 'CARD', 'TRANSFER', 'CHEQUE'),
    defaultValue: 'CASH'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'BROUILLON',
      'EN_ATTENTE_SIGNATURE_CLIENT',
      'SIGNE'
    ),
    defaultValue: 'BROUILLON'
  }
}, {
  tableName: 'documents',
  timestamps: true
});

module.exports = Document;

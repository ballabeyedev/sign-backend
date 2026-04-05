const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const ContratLocataire = sequelize.define('ContratLocataire', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  contratId: {
    type: DataTypes.UUID,
    allowNull: false
  },

  locataireId: {
    type: DataTypes.UUID,
    allowNull: false
  }

});

module.exports = ContratLocataire;
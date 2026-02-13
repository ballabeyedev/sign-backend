const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  photoProfil: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  carte_identite_national_num: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Particulier', 'Independant', 'Professionnel'),
    defaultValue: 'Client',
    allowNull: false
    },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif'),
    defaultValue: 'actif'
  },
  logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  }

}, {
  tableName: 'utilisateur',
  timestamps: true,
  paranoid: true, 
  underscored: true
});

module.exports = User;

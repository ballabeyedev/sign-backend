const Document = require('./document.model');
const TypeFacture = require('./typeFacture.model');
const Utilisateur = require('./utilisateur.model');

Document.belongsTo(Utilisateur, {
  foreignKey: 'clientId',
  as: 'client'
});

Document.belongsTo(TypeFacture, {
  foreignKey: 'typeFactureId',
  as: 'typeFacture'
});

TypeFacture.hasMany(Document, {
  foreignKey: 'typeFactureId',
  as: 'documents',
  onDelete: 'RESTRICT'
});

module.exports = {
  Document,
  TypeFacture,
  Utilisateur
};
const Document = require('./document.model');
const Utilisateur = require('./utilisateur.model');
const DocumentItem = require('./documentItem.model');
const Contrat = require('./contrat.model');


Document.belongsTo(Utilisateur, {
  foreignKey: 'clientId',
  as: 'client'
});

Document.belongsTo(Utilisateur, {
  foreignKey: 'professionnelId',
  as: 'professionnel'
});

Document.hasMany(DocumentItem, {
  foreignKey: 'documentId',
  as: 'items',
  onDelete: 'CASCADE'
});

DocumentItem.belongsTo(Document, {
  foreignKey: 'documentId'
});

Contrat.belongsTo(Utilisateur, {
  foreignKey: 'bailleurId',
  as: 'bailleur'
});

Contrat.belongsToMany(Utilisateur, {
  through: 'ContratLocataires',
  foreignKey: 'contratId',
  as: 'locataires'
});

Utilisateur.hasMany(Contrat, {
  foreignKey: 'bailleurId',
  as: 'contrats'
});

Utilisateur.belongsToMany(Contrat, {
  through: 'ContratLocataires',
  foreignKey: 'locataireId',
  as: 'locations'
});


module.exports = {
  Document,
  DocumentItem,
  Utilisateur,
  Contrat
};

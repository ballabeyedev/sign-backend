const Document = require('./document.model');
const Utilisateur = require('./utilisateur.model');
const DocumentItem = require('./documentItem.model');
const Contrat = require('./contrat.model');
const ContratTravail = require('./contratTravail.model');
const QuittanceLoyer = require('./quittanceLoyer.model');



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

Utilisateur.hasMany(ContratTravail, {
  foreignKey: 'employeurId',
  as: 'contrats_employeur'
});


module.exports = {
  Document,
  DocumentItem,
  ContratTravail,
  QuittanceLoyer,
  Utilisateur,
  Contrat
};

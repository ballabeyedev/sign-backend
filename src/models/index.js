const Document = require('./document.model');
const Utilisateur = require('./utilisateur.model');
const DocumentItem = require('./documentItem.model');

Document.belongsTo(Utilisateur, {
  foreignKey: 'clientId',
  as: 'client'
});

Document.hasMany(DocumentItem, {
  foreignKey: 'documentId',
  onDelete: 'CASCADE'
});

DocumentItem.belongsTo(Document, {
  foreignKey: 'documentId'
});



module.exports = {
  Document,
  DocumentItem,
  Utilisateur
};

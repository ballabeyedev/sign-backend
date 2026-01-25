const GestionDocumentService = require('../../services/professionnel/generationrapport.service');

exports.creerDocument = async (req, res) => {
  const utilisateurConnecte = req.user;
  const { clientId, typeFactureId, description, delais_execution, date_execution, avance,
    lieu_execution, montant, moyen_paiement } = req.body;

  try {
    const result = await GestionDocumentService.creerDocument({
      clientId, typeFactureId, description, delais_execution, date_execution, avance,
      lieu_execution, montant, moyen_paiement, utilisateurConnecte
    });

    if (result.error) return res.status(400).json({ message: result.error });

    return res.status(201).json({
      message: 'Document généré et envoyé pour signature avec succès',
    });

  } catch (err) {
    console.error('Erreur création document :', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la génération du document', erreur: err.message });
  }
};


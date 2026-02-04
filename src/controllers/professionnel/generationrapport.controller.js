const GestionDocumentService = require('../../services/professionnel/generationrapport.service');

exports.creerDocument = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const {
      clientId,
      delais_execution,
      date_execution,
      avance,
      lieu_execution,
      moyen_paiement,
      items
    } = req.body;

    // Appel du service
    const result = await GestionDocumentService.creerDocument({
      clientId,
      delais_execution,
      date_execution,
      avance,
      lieu_execution,
      moyen_paiement,
      items,
      utilisateurConnecte
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document créé avec succès',
      data: {
        documentId: result.document.id,
        numero_facture: result.document.numero_facture
      }
    });

  } catch (error) {
    console.error('❌ Erreur création document :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du document',
      error: error.message
    });
  }
};

// -------------------- LISTE DES CLIENTS (PAGINATION) --------------------
exports.listerDocuments = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await GestionDocumentService.listerDocument({
      page,
      limit
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur controller listerClients:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la récupération des clients',
      erreur: error.message
    });
  }
}

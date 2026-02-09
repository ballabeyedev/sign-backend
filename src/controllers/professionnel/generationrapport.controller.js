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
        documentId: result.id,
        numero_facture: result.numero_facture
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

exports.getMesDocuments = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;

    const result = await GestionDocumentService.getMesDocuments({
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Erreur controller getMesDocuments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.telechargerDocument = async (req, res) => {
  try {
    const utilisateurConnecte = req.user;
    const { documentId } = req.params;

    const result = await GestionDocumentService.telechargerDocument({
      documentId,
      utilisateurConnecte
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=facture-${result.data.numero_facture}.pdf`,
      'Content-Length': result.data.pdfBuffer.length
    });

    return res.send(result.data.pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};



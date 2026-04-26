const GestionFichePaieService = require('../../../services/professionnel/fichePaie/fichePaie.service');

class FichePaieController {

  // ============================================================
  // 🔹 CRÉER FICHE DE PAIE
  // ============================================================
  static async creerFichePaie(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const {
        salarieId,
        ...data
      } = req.body;

      // 🔴 VALIDATION MINIMALE
      if (!salarieId) {
        return res.status(400).json({
          success: false,
          message: "Le salarié (salarieId) est obligatoire."
        });
      }

      const result = await GestionFichePaieService.creerFichePaie({
        utilisateurConnecte,
        salarieId,
        ...data
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============================================================
  // 🔹 MES FICHES DE PAIE
  // ============================================================
  static async getMesFichesPaie(req, res) {
    try {

      const utilisateurConnecte = req.user;

      const result = await GestionFichePaieService.getMesFichesPaie({
        utilisateurConnecte
      });

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============================================================
  // 🔹 DÉTAIL FICHE DE PAIE
  // ============================================================
  static async getFichePaie(req, res) {
    try {

      const utilisateurConnecte = req.user;
      const { fichePaieId } = req.params;

      const result = await GestionFichePaieService.getFichePaieById({
        fichePaieId,
        utilisateurConnecte
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerFichePaie(req, res) {
    try {

      const { fichePaieId } = req.params;

      const result = await GestionFichePaieService.telechargerFichePaie({
        fichePaieId
      });

      if (!result.success) {
        return res.status(404).json(result);
      }

      const { pdfBuffer, numero_fiche } = result.data;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=fiche-paie-${numero_fiche}.pdf`
      );

      return res.send(pdfBuffer);

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = FichePaieController;
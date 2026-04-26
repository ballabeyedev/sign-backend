const Service = require('../../../services/professionnel/fichePaie/fichePaie.service');

class FichePaieController {

  static async creerFichePaie(req, res) {
    const result = await Service.creerFichePaie({
      utilisateurConnecte: req.user,
      ...req.body
    });

    return res.status(result.success ? 201 : 400).json(result);
  }

  static async getMesFichesPaie(req, res) {
    const result = await Service.getMesFichesPaie({
      utilisateurConnecte: req.user
    });

    return res.json(result);
  }

  static async getFichePaie(req, res) {
    const result = await Service.getFichePaieById({
      fichePaieId: req.params.fichePaieId,
      utilisateurConnecte: req.user
    });

    return res.status(result.success ? 200 : 404).json(result);
  }

  static async telechargerFichePaie(req, res) {

    const result = await Service.telechargerFichePaie({
      fichePaieId: req.params.fichePaieId
    });

    if (!result.success) return res.status(404).json(result);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${result.data.numero_fiche}.pdf`);

    return res.send(result.data.pdfBuffer);
  }
}

module.exports = FichePaieController;
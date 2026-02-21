const Facture = require('../../models/document.model');

class GestionFactureService {

  // -------------------- NOMBRE TOTAL DE FACTURES --------------------
  static async nombreTotalFactures() {
    try {
      const total = await Facture.count();

      return {
        message: "Nombre total de factures générées",
        totalFactures: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des factures :", error);
      throw error;
    }
  }

}

module.exports = GestionFactureService;
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


  // -------------------- CONSULTER UNE FACTURE PAR ID --------------------
  static async consulterFacture(id) {
    try {
      const facture = await Facture.findByPk(id);

      if (!facture) {
        throw new Error("Facture introuvable");
      }

      return {
        message: "Facture trouvée avec succès",
        facture
      };

    } catch (error) {
      console.error("Erreur lors de la consultation de la facture :", error);
      throw error;
    }
  }
}

module.exports = GestionFactureService;
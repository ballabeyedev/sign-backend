const { FichePaie } = require('../../../models');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');

const fichePaieTemplate = require('../../../templates/pdf/fichePaie/fichePaie.template');
const envoyerFichePaieEmail = require('./emailFormatFichePaie');

class GestionFichePaieService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO FICHE
  // ============================================================
  static async genererNumeroFiche() {
    try {
      const annee = new Date().getFullYear();

      const derniereFiche = await FichePaie.findOne({
        where: {
          numero_fiche: { [Op.like]: `FICHE-${annee}-%` }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_fiche']
      });

      let compteur = 1;

      if (derniereFiche?.numero_fiche) {
        const parts = derniereFiche.numero_fiche.split('-');
        compteur = parseInt(parts[2], 10) + 1 || 1;
      }

      return `FICHE-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      throw new Error('Erreur génération numéro fiche');
    }
  }

  // ============================================================
  // 🔹 CALCUL SALAIRE
  // ============================================================
  static calculerSalaire(data) {

    const total_primes =
      Number(data.prime_transport || 0) +
      Number(data.prime_logement || 0) +
      Number(data.prime_performance || 0) +
      Number(data.prime_exceptionnelle || 0) +
      Number(data.autres_primes || 0);

    const gain_heures_supp =
      Number(data.heures_supplementaires || 0) *
      Number(data.taux_heure_supp || 0);

    const total_gains =
      Number(data.salaire_brut) +
      total_primes +
      gain_heures_supp +
      Number(data.valeur_avantages || 0);

    const ipres = data.soumis_ipres ? total_gains * 0.056 : 0;
    const css = data.soumis_css ? total_gains * 0.03 : 0;

    const revenu_imposable = total_gains - ipres - css;

    let parts = 1;
    if (data.situation_familiale === 'Marié') parts += 1;
    parts += Math.min((data.nombre_enfants || 0) * 0.5, 2);

    const revenu_par_part = revenu_imposable / parts;

    let ir = 0;

    if (data.soumis_ir) {
      if (revenu_par_part <= 300000) {
        ir = revenu_par_part * 0.1;
      } else if (revenu_par_part <= 600000) {
        ir = (300000 * 0.1) + ((revenu_par_part - 300000) * 0.2);
      } else {
        ir =
          (300000 * 0.1) +
          (300000 * 0.2) +
          ((revenu_par_part - 600000) * 0.3);
      }

      ir *= parts;
    }

    const total_retenues =
      ipres +
      css +
      ir +
      Number(data.mutuelle || 0) +
      Number(data.avance_salaire || 0) +
      Number(data.autres_retenues || 0);

    const salaire_net = total_gains - total_retenues;

    return { total_gains, total_retenues, salaire_net };
  }

  // ============================================================
  // 🔹 CRÉER FICHE DE PAIE
  // ============================================================
  static async creerFichePaie({ utilisateurConnecte, ...data }) {

    const transaction = await sequelize.transaction();

    try {

      // ── VALIDATIONS ─────────────────────────────
      if (!data.nom_salarie) {
        await transaction.rollback();
        return { success: false, error: "Nom salarié requis" };
      }

      if (!data.salaire_brut || Number(data.salaire_brut) <= 0) {
        await transaction.rollback();
        return { success: false, error: "Salaire invalide" };
      }

      if (!data.mois || !data.annee) {
        await transaction.rollback();
        return { success: false, error: "Période requise" };
      }

      // ── NUMÉRO ─────────────────────────────
      const numero_fiche = await this.genererNumeroFiche();

      // ── CALCUL ─────────────────────────────
      const calcul = this.calculerSalaire(data);

      // ── CREATE ─────────────────────────────
      const fiche = await FichePaie.create({
        ...data,
        numero_fiche,
        total_gains: calcul.total_gains,
        total_retenues: calcul.total_retenues,
        salaire_net: calcul.salaire_net,
        fiche_pdf: null
      }, { transaction });

      await transaction.commit();

      // ── PDF ─────────────────────────────
      const pdfBuffer = await fichePaieTemplate({
        fiche,
        calcul
      });

      const pdfBase64 = pdfBuffer.toString('base64');

      await FichePaie.update(
        { fiche_pdf: pdfBase64 },
        { where: { id: fiche.id } }
      );

      // ── EMAIL ─────────────────────────────
      try {
        await envoyerFichePaieEmail({
          numero_fiche,
          nom: fiche.nom_salarie,
          salaire_net: fiche.salaire_net,
          pdfBase64
        });

        console.log("✅ Email fiche envoyé");
      } catch (err) {
        console.error("❌ Erreur email fiche:", err);
      }

      return {
        success: true,
        message: "Fiche de paie générée avec succès",
        data: fiche
      };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerFichePaie({ fichePaieId }) {
    try {

      const fiche = await FichePaie.findByPk(fichePaieId);

      if (!fiche || !fiche.fiche_pdf) {
        return { success: false, message: "PDF introuvable" };
      }

      return {
        success: true,
        data: {
          pdfBuffer: Buffer.from(fiche.fiche_pdf, 'base64'),
          numero_fiche: fiche.numero_fiche
        }
      };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 MES FICHES
  // ============================================================
  static async getMesFichesPaie() {
    try {

      const fiches = await FichePaie.findAll({
        order: [["createdAt", "DESC"]]
      });

      return { success: true, data: fiches };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL
  // ============================================================
  static async getFichePaieById({ fichePaieId }) {
    try {

      const fiche = await FichePaie.findByPk(fichePaieId);

      if (!fiche) {
        return { success: false, error: "Fiche introuvable" };
      }

      return { success: true, data: fiche };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = GestionFichePaieService;
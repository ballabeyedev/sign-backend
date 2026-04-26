const { FichePaie, Utilisateur } = require('../../../models');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');

const fichePaieTemplate = require('../../../templates/pdf/fichePaie/fichePaie.template');
const envoyerFichePaieEmail = require('./emailFormatFichePaie');

class GestionFichePaieService {

  // ============================================================
  // 🔹 GÉNÉRER NUMÉRO FICHE  →  FICHE-2026-0001
  // ============================================================
  static async genererNumeroFiche() {
    try {
      const annee = new Date().getFullYear();

      const derniereFiche = await FichePaie.findOne({
        where: { numero_fiche: { [Op.like]: `FICHE-${annee}-%` } },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_fiche']
      });

      let compteur = 1;
      if (derniereFiche?.numero_fiche) {
        const parts = derniereFiche.numero_fiche.split('-');
        compteur = (parseInt(parts[2], 10) || 0) + 1;
      }

      return `FICHE-${annee}-${String(compteur).padStart(4, '0')}`;

    } catch (error) {
      throw new Error('Erreur génération numéro fiche : ' + error.message);
    }
  }

  // ============================================================
  // 🔹 CALCUL SALAIRE
  // ============================================================
  static calculerSalaire(data) {

    const salaire_brut = Number(data.salaire_brut || 0);
    const prime_transport = Number(data.prime_transport || 0);
    const prime_logement = Number(data.prime_logement || 0);
    const prime_performance = Number(data.prime_performance || 0);
    const prime_exceptionnelle = Number(data.prime_exceptionnelle || 0);
    const autres_primes = Number(data.autres_primes || 0);
    const valeur_avantages = Number(data.valeur_avantages || 0);
    const heures_supp = Number(data.heures_supplementaires || 0);

    // Calcul montant heures supp selon le taux
    let taux = 0;
    if (data.taux_heure_supp === '10%') taux = 0.10;
    else if (data.taux_heure_supp === '25%') taux = 0.25;
    else if (data.taux_heure_supp === '50%') taux = 0.50;

    const taux_horaire = salaire_brut / 173.33; // base mensuelle légale
    const montant_heures_supp = Math.round(heures_supp * taux_horaire * (1 + taux));

    const total_primes = prime_transport + prime_logement + prime_performance
      + prime_exceptionnelle + autres_primes;
    const total_gains = salaire_brut + total_primes + montant_heures_supp + valeur_avantages;

    // Cotisations sociales
    const montant_ipres = data.soumis_ipres ? Math.round(total_gains * 0.056) : 0;
    const montant_css = data.soumis_css ? Math.round(total_gains * 0.03) : 0;

    // Impôt sur le revenu (barème progressif sénégalais)
    let montant_ir = 0;
    if (data.soumis_ir) {
      const revenu_imposable = total_gains - montant_ipres - montant_css;

      let parts = 1;
      if (data.situation_familiale === 'Marié') parts += 1;
      parts += Math.min(Number(data.nombre_enfants || 0) * 0.5, 2);

      const revenu_par_part = revenu_imposable / parts;

      if (revenu_par_part <= 300000) {
        montant_ir = revenu_par_part * 0.10;
      } else if (revenu_par_part <= 600000) {
        montant_ir = (300000 * 0.10) + ((revenu_par_part - 300000) * 0.20);
      } else {
        montant_ir = (300000 * 0.10) + (300000 * 0.20) + ((revenu_par_part - 600000) * 0.30);
      }
      montant_ir = Math.round(montant_ir * parts);
    }

    const mutuelle = Number(data.mutuelle || 0);
    const avance_salaire = Number(data.avance_salaire || 0);
    const autres_retenues = Number(data.autres_retenues || 0);

    const total_retenues = montant_ipres + montant_css + montant_ir
      + mutuelle + avance_salaire + autres_retenues;
    const salaire_net = Math.round(total_gains - total_retenues);

    return {
      total_gains: Math.round(total_gains),
      montant_heures_supp,
      montant_ipres,
      montant_css,
      montant_ir,
      mutuelle,
      avance_salaire,
      autres_retenues,
      total_retenues: Math.round(total_retenues),
      salaire_net
    };
  }

  // ============================================================
  // 🔹 CRÉER FICHE DE PAIE
  // ============================================================
  static async creerFichePaie({ utilisateurConnecte, ...data }) {

    const transaction = await sequelize.transaction();

    try {

      // ── 1. Employeur (connecté)
      const employeur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!employeur) {
        await transaction.rollback();
        return { success: false, message: 'Employeur introuvable.' };
      }

      // ── 2. Salarié (OBLIGATOIRE maintenant)
      if (!data.salarieId) {
        await transaction.rollback();
        return { success: false, message: 'Le salarié est requis.' };
      }

      const salarie = await Utilisateur.findByPk(data.salarieId);
      if (!salarie) {
        await transaction.rollback();
        return { success: false, message: 'Salarié introuvable.' };
      }

      // ── 3. Validations simples
      if (!data.salaire_brut || Number(data.salaire_brut) <= 0) {
        await transaction.rollback();
        return { success: false, message: 'Salaire brut invalide.' };
      }

      if (!data.mois || !data.annee) {
        await transaction.rollback();
        return { success: false, message: 'Mois et année requis.' };
      }

      // ── 4. Numéro fiche
      const numero_fiche = await this.genererNumeroFiche();

      // ── 5. Calcul
      const calcul = this.calculerSalaire(data);

      // ── 6. Création
      const fiche = await FichePaie.create({

        numero_fiche,
        employeurId: employeur.id,
        salarieId: salarie.id,

        // Section salarié (complément)
        numero_ipres: data.numero_ipres || null,
        numero_css: data.numero_css || null,
        poste: data.poste || null,
        date_embauche: data.date_embauche || null,

        // Contrat
        type_contrat: data.type_contrat || 'CDI',

        // Période
        mois: data.mois,
        annee: Number(data.annee),

        // Salaire
        salaire_brut: Number(data.salaire_brut),
        mode_calcul: data.mode_calcul || 'Mensuel',

        // Temps travail
        jours_travailles: data.jours_travailles || null,
        heures_travaillees: data.heures_travaillees || null,
        absence: data.absence || false,
        jours_absence: data.jours_absence || null,
        type_absence: data.type_absence || null,

        // Heures supp
        heures_supplementaires: Number(data.heures_supplementaires || 0),
        taux_heure_supp: data.taux_heure_supp || null,
        montant_heures_supp: calcul.montant_heures_supp,

        // Primes
        prime_transport: Number(data.prime_transport || 0),
        prime_logement: Number(data.prime_logement || 0),
        prime_performance: Number(data.prime_performance || 0),
        prime_exceptionnelle: Number(data.prime_exceptionnelle || 0),
        autres_primes: Number(data.autres_primes || 0),

        // Avantages
        avantages_nature: data.avantages_nature || null,
        valeur_avantages: Number(data.valeur_avantages || 0),

        // Congés
        conges_pris: data.conges_pris || false,
        jours_conges: data.jours_conges || null,
        montant_conges: Number(data.montant_conges || 0),

        // Retenues
        avance_salaire: Number(data.avance_salaire || 0),
        autres_retenues: Number(data.autres_retenues || 0),
        motif_retenue: data.motif_retenue || null,

        // Cotisations
        soumis_ipres: data.soumis_ipres !== false,
        soumis_css: data.soumis_css !== false,
        mutuelle: Number(data.mutuelle || 0),

        // Impôts
        soumis_ir: data.soumis_ir !== false,
        situation_familiale: data.situation_familiale || 'Célibataire',
        nombre_enfants: Number(data.nombre_enfants || 0),

        // Paiement
        mode_paiement: data.mode_paiement,
        date_paiement: data.date_paiement,

        // Résultats
        total_gains: calcul.total_gains,
        montant_ipres: calcul.montant_ipres,
        montant_css: calcul.montant_css,
        montant_ir: calcul.montant_ir,
        total_retenues: calcul.total_retenues,
        salaire_net: calcul.salaire_net,

        fiche_pdf: null

      }, { transaction });

      await transaction.commit();

      // ── PDF
      let pdfBase64 = null;
      try {
        const pdfBuffer = await fichePaieTemplate({
          fiche,
          calcul,
          employeur,
          salarie
        });
        pdfBase64 = pdfBuffer.toString('base64');

        await FichePaie.update(
          { fiche_pdf: pdfBase64 },
          { where: { id: fiche.id } }
        );
      } catch (e) { }

      // ── EMAIL
      try {
        await envoyerFichePaieEmail({
          emailEmployeur: employeur.email,
          numero_fiche,
          nom: `${salarie.prenom} ${salarie.nom}`,
          mois: data.mois,
          annee: data.annee,
          salaire_net: calcul.salaire_net,
          pdfBase64
        });
      } catch (e) { }

      return { success: true, data: fiche };

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 MES FICHES DE PAIE (filtrées par employeur connecté)
  // ============================================================
  static async getMesFichesPaie({ utilisateurConnecte }) {
    try {

      const fiches = await FichePaie.findAll({
        where: { employeurId: utilisateurConnecte.id },
        attributes: { exclude: ['fiche_pdf'] },
        order: [['createdAt', 'DESC']]
      });

      return { success: true, data: fiches };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 DÉTAIL FICHE
  // ============================================================
  static async getFichePaieById({ fichePaieId, utilisateurConnecte }) {
    try {

      const fiche = await FichePaie.findOne({
        where: {
          id: fichePaieId,
          employeurId: utilisateurConnecte.id
        },
        attributes: { exclude: ['fiche_pdf'] },
        include: [
          {
            model: Utilisateur,
            as: 'employeur',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone']
          }
        ]
      });

      if (!fiche) {
        return { success: false, message: 'Fiche de paie introuvable ou accès refusé.' };
      }

      return { success: true, data: fiche };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 🔹 TÉLÉCHARGER PDF
  // ============================================================
  static async telechargerFichePaie({ fichePaieId }) {
    try {

      const fiche = await FichePaie.findByPk(fichePaieId, {
        attributes: ['id', 'numero_fiche', 'fiche_pdf']
      });

      if (!fiche) {
        return { success: false, message: 'Fiche de paie introuvable.' };
      }

      if (!fiche.fiche_pdf) {
        return { success: false, message: 'PDF non encore généré pour cette fiche.' };
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
}

module.exports = GestionFichePaieService;
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

    const salaire_brut         = Number(data.salaire_brut || 0);
    const prime_transport      = Number(data.prime_transport || 0);
    const prime_logement       = Number(data.prime_logement || 0);
    const prime_performance    = Number(data.prime_performance || 0);
    const prime_exceptionnelle = Number(data.prime_exceptionnelle || 0);
    const autres_primes        = Number(data.autres_primes || 0);
    const valeur_avantages     = Number(data.valeur_avantages || 0);
    const heures_supp          = Number(data.heures_supplementaires || 0);

    // Calcul montant heures supp selon le taux
    let taux = 0;
    if (data.taux_heure_supp === '10%') taux = 0.10;
    else if (data.taux_heure_supp === '25%') taux = 0.25;
    else if (data.taux_heure_supp === '50%') taux = 0.50;

    const taux_horaire         = salaire_brut / 173.33; // base mensuelle légale
    const montant_heures_supp  = Math.round(heures_supp * taux_horaire * (1 + taux));

    const total_primes = prime_transport + prime_logement + prime_performance
                       + prime_exceptionnelle + autres_primes;
    const total_gains  = salaire_brut + total_primes + montant_heures_supp + valeur_avantages;

    // Cotisations sociales
    const montant_ipres = data.soumis_ipres ? Math.round(total_gains * 0.056) : 0;
    const montant_css   = data.soumis_css   ? Math.round(total_gains * 0.03)  : 0;

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

    const mutuelle        = Number(data.mutuelle || 0);
    const avance_salaire  = Number(data.avance_salaire || 0);
    const autres_retenues = Number(data.autres_retenues || 0);

    const total_retenues = montant_ipres + montant_css + montant_ir
                         + mutuelle + avance_salaire + autres_retenues;
    const salaire_net    = Math.round(total_gains - total_retenues);

    return {
      total_gains:       Math.round(total_gains),
      montant_heures_supp,
      montant_ipres,
      montant_css,
      montant_ir,
      mutuelle,
      avance_salaire,
      autres_retenues,
      total_retenues:    Math.round(total_retenues),
      salaire_net
    };
  }

  // ============================================================
  // 🔹 CRÉER FICHE DE PAIE
  // ============================================================
  static async creerFichePaie({ utilisateurConnecte, ...data }) {

    const transaction = await sequelize.transaction();

    try {

      // ── 1. Récupérer l'employeur ───────────────────────────
      const employeur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!employeur) {
        await transaction.rollback();
        return { success: false, message: 'Employeur introuvable.' };
      }

      // ── 2. Validations ─────────────────────────────────────
      if (!data.nom_salarie || String(data.nom_salarie).trim() === '') {
        await transaction.rollback();
        return { success: false, message: 'Le nom du salarié est requis.' };
      }

      if (!data.prenom_salarie || String(data.prenom_salarie).trim() === '') {
        await transaction.rollback();
        return { success: false, message: 'Le prénom du salarié est requis.' };
      }

      if (!data.salaire_brut || Number(data.salaire_brut) <= 0) {
        await transaction.rollback();
        return { success: false, message: 'Le salaire brut doit être supérieur à 0.' };
      }

      if (!data.mois) {
        await transaction.rollback();
        return { success: false, message: 'Le mois est requis.' };
      }

      if (!data.annee) {
        await transaction.rollback();
        return { success: false, message: "L'année est requise." };
      }

      if (!data.mode_paiement) {
        await transaction.rollback();
        return { success: false, message: 'Le mode de paiement est requis.' };
      }

      if (!data.date_paiement) {
        await transaction.rollback();
        return { success: false, message: 'La date de paiement est requise.' };
      }

      // ── 3. Numéro unique ───────────────────────────────────
      const numero_fiche = await this.genererNumeroFiche();

      // ── 4. Calcul automatique ──────────────────────────────
      const calcul = this.calculerSalaire(data);

      // ── 5. Création en base ────────────────────────────────
      const fiche = await FichePaie.create({

        numero_fiche,
        employeurId: employeur.id,

        // Section 1 — Employeur
        type_employeur:      data.type_employeur      || 'Entreprise',
        nom_entreprise:      data.nom_entreprise      || null,
        ninea:               data.ninea               || null,
        adresse_employeur:   data.adresse_employeur   || null,
        telephone_employeur: data.telephone_employeur || null,

        // Section 2 — Salarié
        nom_salarie:    data.nom_salarie,
        prenom_salarie: data.prenom_salarie,
        numero_cni:     data.numero_cni    || null,
        numero_ipres:   data.numero_ipres  || null,
        numero_css:     data.numero_css    || null,
        poste:          data.poste         || null,
        date_embauche:  data.date_embauche || null,

        // Section 3 — Contrat
        type_contrat: data.type_contrat || 'CDI',

        // Section 4 — Période
        mois:  data.mois,
        annee: Number(data.annee),

        // Section 5 — Salaire
        salaire_brut: Number(data.salaire_brut),
        mode_calcul:  data.mode_calcul || 'Mensuel',

        // Section 6 — Temps de travail
        jours_travailles:   data.jours_travailles   || null,
        heures_travaillees: data.heures_travaillees  || null,
        absence:            data.absence             || false,
        jours_absence:      data.jours_absence       || null,
        type_absence:       data.type_absence        || null,

        // Section 7 — Heures supp
        heures_supplementaires: Number(data.heures_supplementaires || 0),
        taux_heure_supp:        data.taux_heure_supp || null,
        montant_heures_supp:    calcul.montant_heures_supp,

        // Section 8 — Primes
        prime_transport:      Number(data.prime_transport      || 0),
        prime_logement:       Number(data.prime_logement       || 0),
        prime_performance:    Number(data.prime_performance    || 0),
        prime_exceptionnelle: Number(data.prime_exceptionnelle || 0),
        autres_primes:        Number(data.autres_primes        || 0),

        // Section 9 — Avantages nature
        avantages_nature: data.avantages_nature || null,
        valeur_avantages: Number(data.valeur_avantages || 0),

        // Section 10 — Congés
        conges_pris:    data.conges_pris  || false,
        jours_conges:   data.jours_conges || null,
        montant_conges: Number(data.montant_conges || 0),

        // Section 11 — Retenues
        avance_salaire:  Number(data.avance_salaire  || 0),
        autres_retenues: Number(data.autres_retenues || 0),
        motif_retenue:   data.motif_retenue          || null,

        // Section 12 — Cotisations
        soumis_ipres: data.soumis_ipres !== false,
        soumis_css:   data.soumis_css   !== false,
        mutuelle:     Number(data.mutuelle || 0),

        // Section 13 — Impôts
        soumis_ir:           data.soumis_ir !== false,
        situation_familiale: data.situation_familiale || 'Célibataire',
        nombre_enfants:      Number(data.nombre_enfants || 0),

        // Section 14 — Paiement
        mode_paiement: data.mode_paiement,
        date_paiement: data.date_paiement,

        // Résultats calculs
        total_gains:    calcul.total_gains,
        montant_ipres:  calcul.montant_ipres,
        montant_css:    calcul.montant_css,
        montant_ir:     calcul.montant_ir,
        total_retenues: calcul.total_retenues,
        salaire_net:    calcul.salaire_net,
        fiche_pdf:      null

      }, { transaction });

      await transaction.commit();

      // ── 6. Génération PDF (ne bloque pas) ──────────────────
      let pdfBase64 = null;
      try {
        const pdfBuffer = await fichePaieTemplate({ fiche, calcul, employeur });
        pdfBase64 = pdfBuffer.toString('base64');
        await FichePaie.update({ fiche_pdf: pdfBase64 }, { where: { id: fiche.id } });
        console.log('✅ PDF fiche de paie généré');
      } catch (pdfErr) {
        console.error('❌ Erreur PDF:', pdfErr.message);
      }

      // ── 7. Email (ne bloque pas) ───────────────────────────
      try {
        await envoyerFichePaieEmail({
          emailEmployeur: employeur.email,
          numero_fiche,
          nom:         `${data.prenom_salarie} ${data.nom_salarie}`,
          mois:        data.mois,
          annee:       data.annee,
          salaire_net: calcul.salaire_net,
          pdfBase64
        });
        console.log('✅ Email fiche de paie envoyé');
      } catch (emailErr) {
        console.error('❌ Erreur email:', emailErr.message);
      }

      return {
        success: true,
        message: 'Fiche de paie générée avec succès.',
        data: {
          ...fiche.toJSON(),
          calcul_detail: {
            total_gains:        calcul.total_gains,
            montant_heures_supp:calcul.montant_heures_supp,
            montant_ipres:      calcul.montant_ipres,
            montant_css:        calcul.montant_css,
            montant_ir:         calcul.montant_ir,
            mutuelle:           calcul.mutuelle,
            avance_salaire:     calcul.avance_salaire,
            autres_retenues:    calcul.autres_retenues,
            total_retenues:     calcul.total_retenues,
            salaire_net:        calcul.salaire_net
          }
        }
      };

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error('Erreur creerFichePaie:', error);
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
          pdfBuffer:    Buffer.from(fiche.fiche_pdf, 'base64'),
          numero_fiche: fiche.numero_fiche
        }
      };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = GestionFichePaieService;
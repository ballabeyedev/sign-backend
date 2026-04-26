const { FichePaie, Utilisateur } = require('../../../models');
const sequelize = require('../../../config/db');
const { Op } = require('sequelize');
const fichePaieTemplate = require('../../../templates/pdf/fichePaie/fichePaie.template');
const envoyerFichePaieEmail = require('./emailFormatFichePaie');

class GestionFichePaieService {

  static async genererNumeroFiche() {
    const annee = new Date().getFullYear();

    const last = await FichePaie.findOne({
      where: { numero_fiche: { [Op.like]: `FICHE-${annee}-%` } },
      order: [['createdAt', 'DESC']]
    });

    let compteur = 1;

    if (last?.numero_fiche) {
      const parts = last.numero_fiche.split('-');
      compteur = (parseInt(parts[2]) || 0) + 1;
    }

    return `FICHE-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  // ======================================================
  static calculerSalaire(data) {

    const tauxMap = { '10%': 0.10, '25%': 0.25, '50%': 0.50 };
    const taux = tauxMap[data.taux_heure_supp] || 0;

    const salaire_brut = Number(data.salaire_brut || 0);
    const heures_supp = Number(data.heures_supplementaires || 0);

    const taux_horaire = salaire_brut / 173.33;
    const montant_heures_supp = Math.round(heures_supp * taux_horaire * (1 + taux));

    const total_primes =
      Number(data.prime_transport || 0) +
      Number(data.prime_logement || 0) +
      Number(data.prime_performance || 0) +
      Number(data.prime_exceptionnelle || 0) +
      Number(data.autres_primes || 0);

    const total_gains = salaire_brut + total_primes + montant_heures_supp;

    const ipres = data.soumis_ipres ? total_gains * 0.056 : 0;
    const css = data.soumis_css ? total_gains * 0.03 : 0;

    let ir = 0;
    if (data.soumis_ir) {
      const revenu = total_gains - ipres - css;

      let parts = 1;
      if (data.situation_familiale === 'Marié') parts += 1;
      parts += Math.min((data.nombre_enfants || 0) * 0.5, 2);

      const base = revenu / parts;

      if (base <= 300000) ir = base * 0.10;
      else if (base <= 600000) ir = (300000 * 0.10) + ((base - 300000) * 0.20);
      else ir = (300000 * 0.10) + (300000 * 0.20) + ((base - 600000) * 0.30);

      ir = ir * parts;
    }

    const retenues =
      ipres + css + ir +
      Number(data.mutuelle || 0) +
      Number(data.avance_salaire || 0) +
      Number(data.autres_retenues || 0);

    const net = total_gains - retenues;

    return {
      total_gains: Math.round(total_gains),
      montant_heures_supp,
      montant_ipres: Math.round(ipres),
      montant_css: Math.round(css),
      montant_ir: Math.round(ir),
      total_retenues: Math.round(retenues),
      salaire_net: Math.round(net)
    };
  }

  // ======================================================
  static async creerFichePaie({ utilisateurConnecte, salarieId, ...data }) {

    const t = await sequelize.transaction();

    try {

      const employeur = await Utilisateur.findByPk(utilisateurConnecte.id);
      if (!employeur) throw new Error("Employeur introuvable");

      const salarie = await Utilisateur.findByPk(salarieId);
      if (!salarie) throw new Error("Salarié introuvable");

      const numero_fiche = await this.genererNumeroFiche();
      const calcul = this.calculerSalaire(data);

      const fiche = await FichePaie.create({
        numero_fiche,
        employeurId: employeur.id,
        salarieId: salarie.id,

        type_contrat: data.type_contrat || 'CDI',
        mois: data.mois,
        annee: data.annee,
        salaire_brut: data.salaire_brut,

        heures_supplementaires: data.heures_supplementaires || 0,
        taux_heure_supp: data.taux_heure_supp,

        prime_transport: data.prime_transport || 0,
        prime_logement: data.prime_logement || 0,
        prime_performance: data.prime_performance || 0,
        prime_exceptionnelle: data.prime_exceptionnelle || 0,

        mutuelle: data.mutuelle || 0,
        avance_salaire: data.avance_salaire || 0,
        autres_retenues: data.autres_retenues || 0,

        soumis_ipres: data.soumis_ipres !== false,
        soumis_css: data.soumis_css !== false,
        soumis_ir: data.soumis_ir !== false,

        situation_familiale: data.situation_familiale || 'Célibataire',
        nombre_enfants: data.nombre_enfants || 0,

        mode_paiement: data.mode_paiement,
        date_paiement: data.date_paiement,

        ...calcul
      }, { transaction: t });

      await t.commit();

      // PDF + EMAIL
      const pdf = await fichePaieTemplate({ fiche, calcul, employeur, salarie });

      const base64 = pdf.toString('base64');

      await FichePaie.update({ fiche_pdf: base64 }, { where: { id: fiche.id } });

      await envoyerFichePaieEmail({
        emailEmployeur: employeur.email,
        numero_fiche,
        nom: `${salarie.prenom} ${salarie.nom}`,
        mois: data.mois,
        annee: data.annee,
        salaire_net: calcul.salaire_net,
        pdfBase64: base64
      });

      return { success: true, data: fiche };

    } catch (err) {
      if (!t.finished) await t.rollback();
      return { success: false, message: err.message };
    }
  }

  static async getMesFichesPaie({ utilisateurConnecte }) {
    return {
      success: true,
      data: await FichePaie.findAll({
        where: { employeurId: utilisateurConnecte.id },
        order: [['createdAt', 'DESC']]
      })
    };
  }

  static async getFichePaieById({ fichePaieId, utilisateurConnecte }) {

    const fiche = await FichePaie.findOne({
      where: {
        id: fichePaieId,
        employeurId: utilisateurConnecte.id
      },
      include: [{ model: Utilisateur, as: 'salarie' }]
    });

    if (!fiche) {
      return { success: false, message: "Introuvable" };
    }

    return { success: true, data: fiche };
  }

  static async telechargerFichePaie({ fichePaieId }) {

    const fiche = await FichePaie.findByPk(fichePaieId);

    if (!fiche?.fiche_pdf) {
      return { success: false };
    }

    return {
      success: true,
      data: {
        pdfBuffer: Buffer.from(fiche.fiche_pdf, 'base64'),
        numero_fiche: fiche.numero_fiche
      }
    };
  }
}

module.exports = GestionFichePaieService;
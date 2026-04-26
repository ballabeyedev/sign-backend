const PDFDocument = require('pdfkit');

module.exports = async function fichePaieTemplate(data) {

  const { fiche, calcul } = data;

  const val = v => v ?? '—';
  const today = new Date().toLocaleDateString('fr-FR');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // =========================
    // HEADER
    // =========================
    doc.fontSize(18).text('FICHE DE PAIE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`N° Fiche : ${fiche.numero_fiche}`);
    doc.text(`Période : ${val(fiche.mois)} ${val(fiche.annee)}`);
    doc.text(`Date d’émission : ${today}`);
    doc.moveDown();

    // =========================
    // EMPLOYEUR
    // =========================
    doc.fontSize(11).text('SECTION — EMPLOYEUR');
    doc.moveDown();

    doc.text(`Type : ${val(fiche.type_employeur)}`);
    doc.text(`Nom / Raison sociale : ${val(fiche.nom_entreprise)}`);
    doc.text(`NINEA : ${val(fiche.ninea)}`);
    doc.text(`Adresse : ${val(fiche.adresse_employeur)}`);
    doc.text(`Téléphone : ${val(fiche.telephone_employeur)}`);
    doc.moveDown();

    // =========================
    // SALARIÉ
    // =========================
    doc.text('SECTION — SALARIÉ');
    doc.moveDown();

    doc.text(`Nom : ${val(fiche.nom_salarie)} ${val(fiche.prenom_salarie)}`);
    doc.text(`CNI : ${val(fiche.numero_cni)}`);
    doc.text(`IPRES : ${val(fiche.numero_ipres)}`);
    doc.text(`CSS : ${val(fiche.numero_css)}`);
    doc.text(`Poste : ${val(fiche.poste)}`);
    doc.text(`Date embauche : ${val(fiche.date_embauche)}`);
    doc.moveDown();

    // =========================
    // SALAIRE
    // =========================
    doc.text('SECTION — SALAIRE');
    doc.moveDown();

    doc.text(`Salaire brut : ${val(fiche.salaire_brut)} FCFA`);
    doc.text(`Mode de calcul : ${val(fiche.mode_calcul)}`);
    doc.moveDown();

    // =========================
    // TEMPS DE TRAVAIL
    // =========================
    doc.text('SECTION — TEMPS DE TRAVAIL');
    doc.moveDown();

    doc.text(`Jours travaillés : ${val(fiche.jours_travailles)}`);
    doc.text(`Heures travaillées : ${val(fiche.heures_travaillees)}`);
    doc.text(`Absence : ${fiche.absence ? 'Oui' : 'Non'}`);

    if (fiche.absence) {
      doc.text(`Jours absence : ${val(fiche.jours_absence)}`);
      doc.text(`Type : ${val(fiche.type_absence)}`);
    }

    doc.moveDown();

    // =========================
    // HEURES SUPPLÉMENTAIRES
    // =========================
    doc.text('SECTION — HEURES SUPPLÉMENTAIRES');
    doc.moveDown();

    doc.text(`Heures : ${val(fiche.heures_supplementaires)}`);
    doc.text(`Taux : ${val(fiche.taux_heure_supp)}`);
    doc.moveDown();

    // =========================
    // PRIMES
    // =========================
    doc.text('SECTION — PRIMES');
    doc.moveDown();

    doc.text(`Transport : ${val(fiche.prime_transport)} FCFA`);
    doc.text(`Logement : ${val(fiche.prime_logement)} FCFA`);
    doc.text(`Performance : ${val(fiche.prime_performance)} FCFA`);
    doc.text(`Exceptionnelle : ${val(fiche.prime_exceptionnelle)} FCFA`);
    doc.text(`Autres : ${val(fiche.autres_primes)} FCFA`);
    doc.moveDown();

    // =========================
    // AVANTAGES
    // =========================
    doc.text('SECTION — AVANTAGES EN NATURE');
    doc.moveDown();

    doc.text(`Type : ${val(fiche.avantages_nature)}`);
    doc.text(`Valeur : ${val(fiche.valeur_avantages)} FCFA`);
    doc.moveDown();

    // =========================
    // RETENUES
    // =========================
    doc.text('SECTION — RETENUES');
    doc.moveDown();

    doc.text(`Avance : ${val(fiche.avance_salaire)} FCFA`);
    doc.text(`Autres : ${val(fiche.autres_retenues)} FCFA`);
    doc.text(`Motif : ${val(fiche.motif_retenue)}`);
    doc.moveDown();

    // =========================
    // RÉCAPITULATIF
    // =========================
    doc.text('SECTION — RÉCAPITULATIF');
    doc.moveDown();

    doc.text(`Total gains : ${val(fiche.total_gains)} FCFA`);
    doc.text(`Total retenues : ${val(fiche.total_retenues)} FCFA`);
    doc.text(`Salaire net : ${val(fiche.salaire_net)} FCFA`);
    doc.moveDown();

    // =========================
    // PAIEMENT
    // =========================
    doc.text('SECTION — PAIEMENT');
    doc.moveDown();

    doc.text(`Mode : ${val(fiche.mode_paiement)}`);
    doc.text(`Date : ${val(fiche.date_paiement)}`);
    doc.moveDown();

    // =========================
    // SIGNATURE
    // =========================
    doc.text('Signature employeur :');
    doc.moveDown(3);

    doc.text(`${val(fiche.nom_entreprise)}`);
    doc.moveDown();

    doc.end();
  });
};
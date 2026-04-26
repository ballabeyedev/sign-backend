const PDFDocument = require('pdfkit');

module.exports = async function fichePaieTemplate({ fiche }) {

  const val = v => (v !== undefined && v !== null && v !== '' ? v : '—');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // =========================
    // HEADER
    // =========================
    doc.fontSize(18).text('FICHE DE PAIE - SÉNÉGAL', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10)
      .text(`N° Fiche : ${val(fiche.numero_fiche)}`)
      .text(`Période : ${val(fiche.mois)} / ${val(fiche.annee)}`)
      .moveDown();

    // =========================
    // EMPLOYEUR
    // =========================
    doc.fontSize(12).text('EMPLOYEUR');
    doc.fontSize(10);

    doc.text(`Entreprise : ${val(fiche.nom_entreprise)}`);
    doc.text(`Type : ${val(fiche.type_employeur)}`);
    doc.text(`NINEA : ${val(fiche.ninea)}`);
    doc.text(`Téléphone : ${val(fiche.telephone_employeur)}`);
    doc.text(`Adresse : ${val(fiche.adresse_employeur)}`);
    doc.moveDown();

    // =========================
    // SALARIÉ
    // =========================
    doc.fontSize(12).text('SALARIÉ');
    doc.fontSize(10);

    doc.text(`Nom : ${val(fiche.prenom_salarie)} ${val(fiche.nom_salarie)}`);
    doc.text(`CNI : ${val(fiche.numero_cni)}`);
    doc.text(`Email : ${val(fiche.email_salarie)}`);
    doc.text(`Poste : ${val(fiche.poste)}`);
    doc.text(`Date embauche : ${val(fiche.date_embauche)}`);
    doc.text(`IPRES : ${val(fiche.numero_ipres)}`);
    doc.text(`CSS : ${val(fiche.numero_css)}`);

    doc.moveDown();

    // =========================
    // TRAVAIL
    // =========================
    doc.fontSize(12).text('TEMPS DE TRAVAIL');
    doc.fontSize(10);

    doc.text(`Jours travaillés : ${val(fiche.nombre_jours_travailles)}`);
    doc.text(`Heures travaillées : ${val(fiche.nombre_heures_travailles)}`);

    if (fiche.absence) {
      doc.text(`Absence : Oui`);
      doc.text(`Type absence : ${val(fiche.type_absence)}`);
      doc.text(`Jours absence : ${val(fiche.nombre_jours_absence)}`);
    } else {
      doc.text(`Absence : Non`);
    }

    doc.moveDown();

    // =========================
    // PRIMES
    // =========================
    doc.fontSize(12).text('PRIMES');
    doc.fontSize(10);

    doc.text(`Transport : ${val(fiche.prime_transport)} FCFA`);
    doc.text(`Logement : ${val(fiche.prime_logement)} FCFA`);
    doc.text(`Performance : ${val(fiche.prime_performance)} FCFA`);
    doc.text(`Exceptionnelle : ${val(fiche.prime_exceptionnelle)} FCFA`);
    doc.text(`Autres : ${val(fiche.autres_primes)} FCFA`);

    doc.moveDown();

    // =========================
    // HEURES SUP
    // =========================
    doc.fontSize(12).text('HEURES SUPPLÉMENTAIRES');
    doc.fontSize(10);

    doc.text(`Heures : ${val(fiche.nombre_heures_supplementaires)}`);
    doc.text(`Montant : ${val(fiche.montant_heures_supp)} FCFA`);

    doc.moveDown();

    // =========================
    // COTISATIONS
    // =========================
    doc.fontSize(12).text('COTISATIONS');
    doc.fontSize(10);

    doc.text(`IPRES : ${val(fiche.montant_ipres)} FCFA`);
    doc.text(`CSS : ${val(fiche.montant_css)} FCFA`);
    doc.text(`IR : ${val(fiche.montant_ir)} FCFA`);

    doc.moveDown();

    // =========================
    // RETENUES
    // =========================
    doc.fontSize(12).text('RETENUES');
    doc.fontSize(10);

    doc.text(`Avance salaire : ${val(fiche.montant_avance_salaire)} FCFA`);
    doc.text(`Autres retenues : ${val(fiche.montant_retenue)} FCFA`);
    doc.text(`Assurance : ${val(fiche.montant_assurance)} FCFA`);

    doc.moveDown();

    // =========================
    // TOTAUX
    // =========================
    doc.fontSize(12).text('RÉCAPITULATIF');
    doc.fontSize(11);

    doc.text(`TOTAL GAIN : ${val(fiche.total_gains)} FCFA`);
    doc.text(`TOTAL RETENUES : ${val(fiche.total_retenues)} FCFA`);

    doc.fontSize(14).text(`SALAIRE NET : ${val(fiche.salaire_net)} FCFA`, {
      underline: true
    });

    doc.moveDown(2);

    // =========================
    // SIGNATURE
    // =========================
    doc.fontSize(10);

    doc.text('Signature Employeur : ______________________', { align: 'left' });
    doc.moveDown();
    doc.text('Signature Salarié : ______________________', { align: 'left' });

    doc.end();
  });
};
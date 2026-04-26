const PDFDocument = require('pdfkit');

module.exports = async function fichePaieTemplate({ fiche }) {

  const val = v => (v !== undefined && v !== null && v !== '' ? v : '—');

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    doc.on('error', reject);

    // ======================
    doc.fontSize(18).text('FICHE DE PAIE - SÉNÉGAL', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10)
      .text(`N° : ${val(fiche.numero_fiche)}`)
      .text(`Période : ${val(fiche.mois)} / ${val(fiche.annee)}`);

    doc.moveDown();

    // EMPLOYEUR
    doc.fontSize(12).text('EMPLOYEUR');
    doc.fontSize(10);

    doc.text(`Type : ${val(fiche.type_employeur)}`);
    doc.text(`Entreprise : ${val(fiche.nom_entreprise)}`);
    doc.text(`NINEA : ${val(fiche.ninea)}`);

    doc.moveDown();

    // SALARIÉ
    doc.fontSize(12).text('SALARIÉ');
    doc.fontSize(10);

    doc.text(`Nom : ${val(fiche.nom_salarie)} ${val(fiche.prenom_salarie)}`);
    doc.text(`CNI : ${val(fiche.numero_cni)}`);

    doc.moveDown();

    // SALAIRE
    doc.fontSize(12).text('SALAIRE');
    doc.fontSize(10);

    doc.text(`Brut : ${val(fiche.salaire_brut)} FCFA`);
    doc.text(`Net : ${val(fiche.salaire_net)} FCFA`);

    doc.end();
  });
};
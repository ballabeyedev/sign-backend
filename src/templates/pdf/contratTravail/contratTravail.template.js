const PDFDocument = require('pdfkit');

module.exports = async function contratTravailTemplate(data) {

  const {
    numero_contrat,
    employeur,
    salarie,
    contrat
  } = data;

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
    doc.fontSize(18).text('CONTRAT DE TRAVAIL (CDI)', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`N° Contrat : ${numero_contrat}`);
    doc.text(`Date : ${today}`);
    doc.moveDown();

    // =========================
    // PARTIES
    // =========================
    doc.fontSize(11).text('Entre les soussignés :');
    doc.moveDown();

    doc.text('L’Employeur :');
    doc.text(`${val(employeur.nom)} ${val(employeur.prenom)}, sis à ${val(employeur.adresse)}, téléphone ${val(employeur.telephone)}, email ${val(employeur.email)}.`);
    doc.text(`Immatriculée sous le NINEA ${val(employeur.ninea)} et le RCCM ${val(employeur.rc)}.`);
    doc.text(`Ci-après dénommé « l’Employeur »`);
    doc.moveDown();

    doc.text('ET');
    doc.moveDown();

    doc.text('Le Salarié :');
    doc.text(`M./Mme ${val(salarie.nom)} ${val(salarie.prenom)}, titulaire de la CNI n° ${val(salarie.cni)}, domicilié(e) à ${val(salarie.adresse)}, téléphone ${val(salarie.telephone)}.`);
    doc.text(`Ci-après dénommé « le Salarié »`);
    doc.moveDown();

    // =========================
    // ARTICLE 1
    // =========================
    doc.text('ARTICLE 1 – OBJET DU CONTRAT');
    doc.text(`Le présent contrat de travail est conclu conformément aux dispositions du Code du travail en vigueur au Sénégal. Il a pour objet de définir les conditions dans lesquelles le Salarié est recruté par l’Employeur ainsi que les droits, obligations et responsabilités des deux parties dans le cadre de leur relation professionnelle.`);
    doc.moveDown();

    // =========================
    // ARTICLE 2
    // =========================
    doc.text('ARTICLE 2 – NATURE DU CONTRAT');
    doc.text(`Le présent contrat est un contrat à durée indéterminée (CDI) prenant effet à compter du ${val(contrat.date_debut)}. Il est conclu sans limitation de durée.`);
    doc.moveDown();

    // =========================
    // ARTICLE 3
    // =========================
    doc.text('ARTICLE 3 – FONCTION ET MISSIONS');
    doc.text(`Le Salarié est engagé en qualité de : ${val(contrat.poste)}.`);
    doc.text(`Dans le cadre de ses fonctions, il sera chargé notamment des missions suivantes :`);

    (contrat.missions || []).forEach(m => {
      doc.text(`- ${m}`);
    });

    doc.text(`Le Salarié s’engage à exécuter ses fonctions avec professionnalisme.`);
    doc.moveDown();

    // =========================
    // ARTICLE 4
    // =========================
    doc.text('ARTICLE 4 – LIEU DE TRAVAIL');
    doc.text(`Le lieu principal est fixé à : ${val(contrat.lieu_travail)}.`);
    doc.moveDown();

    // =========================
    // ARTICLE 5
    // =========================
    doc.text('ARTICLE 5 – TEMPS DE TRAVAIL');
    doc.text(`Jours : ${val(contrat.jour_travail)}`);
    doc.text(`Horaires : ${val(contrat.heure_debut)} à ${val(contrat.heure_fin)}`);
    doc.text(`Pause : ${val(contrat.temps_pause)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 6
    // =========================
    doc.text('ARTICLE 6 – RÉMUNÉRATION');
    doc.text(`Salaire : ${val(contrat.salaire_mensuel)} FCFA`);
    doc.text(`Mode de paiement : ${val(contrat.moyen_paiement)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 7
    // =========================
    doc.text('ARTICLE 7 – CONGÉS ET JOURS FÉRIÉS');
    doc.text(`${val(contrat.nbr_jours_conges)} jours par an`);
    const mapFeries = {
    'rémunérés': 'rémérés',
    'non rémunérés': 'non rémunérés',
    'travail_effectif': 'rémunérés uniquement en cas de travail effectif'
    };

    doc.text(mapFeries[contrat.remuneration_jours_feries] || '—');
    doc.moveDown();

    // =========================
    // ARTICLE 8
    // =========================
    doc.text('ARTICLE 8 – ABSENCE POUR MALADIE');
    const mapAbsence = {
    'rémunérés': 'rémunérées',
    'non rémunérés': 'non rémunérées',
    'sous_conditions': 'rémunérées sous conditions (ancienneté, justification, validation médicale)'
    };

    doc.text(mapAbsence[contrat.remuneration_absences_maladie] || '—');
    doc.moveDown();

    // =========================
    // ARTICLE 9
    // =========================
    doc.text('ARTICLE 9 – RETARDS ET DISCIPLINE');
    doc.text(`Le Salarié doit respecter les horaires.`);
    doc.moveDown();

    // =========================
    // ARTICLE 10
    // =========================
    doc.text('ARTICLE 10 – AVANCES SUR SALAIRE');
    doc.text(contrat.avance_salaire ? 'autorisées' : 'non autorisées');
    doc.moveDown();

    // =========================
    // ARTICLE 11
    // =========================
    doc.text('ARTICLE 11 – AVANTAGES EN NATURE');

    const avantages = contrat.avantages_salarial || [];
    doc.text(avantages.includes('logement') ? '☑ logement' : '☐ logement');
    doc.text(avantages.includes('nourriture') ? '☑ nourriture' : '☐ nourriture');
    doc.text(avantages.includes('transport') ? '☑ transport' : '☐ transport');

    doc.moveDown();

    // =========================
    // ARTICLE 12
    // =========================
    doc.text('ARTICLE 12 – OBLIGATIONS DU SALARIÉ');
    doc.text(`Le Salarié s’engage à respecter les règles.`);
    doc.moveDown();

    // =========================
    // ARTICLE 13
    // =========================
    doc.text('ARTICLE 13 – CLAUSES PARTICULIÈRES');

    const clauses = contrat.clauses || [];
    doc.text(clauses.includes('confidentialite') ? '☑ clause de confidentialité' : '☐ clause de confidentialité');
    doc.text(clauses.includes('non_concurrence') ? '☑ clause de non-concurrence' : '☐ clause de non-concurrence');
    doc.text(clauses.includes('exclusivite') ? '☑ clause d’exclusivité' : '☐ clause d’exclusivité');

    doc.moveDown();

    // =========================
    // ARTICLE 14
    // =========================
    doc.text('ARTICLE 14 – RUPTURE DU CONTRAT');
    doc.text(`Préavis : ${val(contrat.duree_preavis)}`);
    doc.moveDown();

    // =========================
    // ARTICLE 15
    // =========================
    doc.text('ARTICLE 15 – DISPOSITIONS GÉNÉRALES');
    doc.text(`Régi par le Code du travail sénégalais.`);
    doc.moveDown();

    // =========================
    // ARTICLE 16
    // =========================
    doc.text('ARTICLE 16 – ASSURANCE');

    const assurance = contrat.assurance_maladie || {};

    doc.text(assurance.type === 'aucune' ? '☑ aucune assurance' : '☐ aucune assurance');
    doc.text(assurance.type === 'basique' ? '☑ assurance basique' : '☐ assurance basique');
    doc.text(assurance.type === 'intermediaire' ? '☑ assurance intermédiaire' : '☐ assurance intermédiaire');
    doc.text(assurance.type === 'complete' ? '☑ assurance complète' : '☐ assurance complète');

    doc.moveDown();

    // =========================
    // SIGNATURE
    // =========================
    doc.moveDown();
    doc.text(`Fait à ${val(contrat.lieu_signature)}, le ${val(contrat.date_signature)}`);
    doc.moveDown(2);

    doc.text("L’Employeur                          Le Salarié");
    doc.moveDown(4);
    doc.text("Signature                            Signature");

    doc.end();
  });
};
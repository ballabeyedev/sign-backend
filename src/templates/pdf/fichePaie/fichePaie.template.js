const PDFDocument = require('pdfkit');

module.exports = async function fichePaieTemplate({ fiche }) {

  const val = v => (v !== undefined && v !== null && v !== '' ? v : '—');

  const fmt = v => {
    const raw = val(v);
    if (raw === '—') return '—';
    const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    if (isNaN(n)) return raw;
    return n.toLocaleString('fr-FR') + ' FCFA';
  };

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ─────────────────────────────────────────
    // CONSTANTES DE MISE EN PAGE
    // ─────────────────────────────────────────
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 30;
    const INNER_W = PAGE_W - MARGIN * 2;

    const BLACK = '#0D0D0D';
    const DARK_GRAY = '#2C2C2C';
    const MID_GRAY = '#5A5A5A';
    const LIGHT_GRAY = '#D6D6D6';
    const NEAR_WHITE = '#F5F5F5';

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────

    /** Bandeau section (fond sombre, texte blanc) */
    function sectionHeader(y, title) {
      doc.rect(MARGIN, y, INNER_W, 18).fill(DARK_GRAY);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
        .text(title.toUpperCase(), MARGIN + 8, y + 5, { width: INNER_W - 16 });
      return y + 18;
    }

    /**
     * Grille info 4 colonnes : label | valeur | label | valeur
     * rows = [ [label, value, label, value], ... ]
     */
    function infoGrid(yStart, rows) {
      const COL = [0, 95, 185, 285];  // offsets relatifs à MARGIN
      const ROW_H = 16;

      rows.forEach((row, i) => {
        const y = yStart + i * ROW_H;
        const bg = i % 2 === 0 ? '#FFFFFF' : NEAR_WHITE;
        doc.rect(MARGIN, y, INNER_W, ROW_H).fill(bg);

        // Colonne gauche
        doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
          .text(row[0] || '', MARGIN + COL[0] + 5, y + 4, { width: 88, ellipsis: true });
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica-Bold')
          .text(row[1] || '', MARGIN + COL[1] + 2, y + 4, { width: 95, ellipsis: true });

        // Séparateur vertical milieu
        doc.moveTo(MARGIN + INNER_W / 2, y + 2)
          .lineTo(MARGIN + INNER_W / 2, y + ROW_H - 2)
          .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

        // Colonne droite
        doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
          .text(row[2] || '', MARGIN + INNER_W / 2 + 5, y + 4, { width: 88, ellipsis: true });
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica-Bold')
          .text(row[3] || '', MARGIN + INNER_W / 2 + 100, y + 4, { width: 95, ellipsis: true });
      });

      // Bordure externe
      doc.rect(MARGIN, yStart, INNER_W, rows.length * ROW_H)
        .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

      return yStart + rows.length * ROW_H;
    }

    // ─────────────────────────────────────────
    // BANDEAU TITRE
    // ─────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 55).fill(BLACK);

    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
      .text('BULLETIN DE PAIE', MARGIN, 12, { align: 'center', width: INNER_W });

    doc.fillColor(LIGHT_GRAY).fontSize(8.5).font('Helvetica')
      .text(
        `N° ${val(fiche.numero_fiche)}   |   Période : ${val(fiche.mois)} / ${val(fiche.annee)}`,
        MARGIN, 35, { align: 'center', width: INNER_W }
      );

    let y = 65;

    // ─────────────────────────────────────────
    // EMPLOYEUR
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Informations Employeur');
    y = infoGrid(y, [
      ["Entreprise", val(fiche.nom_entreprise), "NINEA", val(fiche.ninea)],
      ["Représentant", val(fiche.representant), "Téléphone", val(fiche.telephone_employeur)],
      ["Adresse", val(fiche.adresse_employeur), "", ""],
    ]);
    y += 6;

    // ─────────────────────────────────────────
    // SALARIÉ
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Informations Salarié');
    y = infoGrid(y, [
      ["Nom & Prénom", `${val(fiche.prenom_salarie)} ${val(fiche.nom_salarie)}`,
        "Poste", val(fiche.poste)],
      ["N° CNI", val(fiche.numero_cni), "Date d'embauche", val(fiche.date_embauche)],
      ["Email", val(fiche.email_salarie), "N° IPRES", val(fiche.numero_ipres)],
      ["", "", "N° CSS", val(fiche.numero_css)],
    ]);
    y += 6;

    // ─────────────────────────────────────────
    // TEMPS DE TRAVAIL
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Temps de Travail');

    const absenceRows = fiche.absence
      ? [
        ["Jours travaillés", String(val(fiche.nombre_jours_travailles)), "Absence", "Oui"],
        ["Heures travaillées", String(val(fiche.nombre_heures_travailles)), "Type d'absence", val(fiche.type_absence)],
        ["H. supplémentaires", String(val(fiche.nombre_heures_supplementaires)), "Jours absence", String(val(fiche.nombre_jours_absence))],
      ]
      : [
        ["Jours travaillés", String(val(fiche.nombre_jours_travailles)), "Absence", "Non"],
        ["Heures travaillées", String(val(fiche.nombre_heures_travailles)), "H. supplémentaires", String(val(fiche.nombre_heures_supplementaires))],
      ];

    y = infoGrid(y, absenceRows);
    y += 8;

    // ─────────────────────────────────────────
    // TABLEAU FINANCIER
    // ─────────────────────────────────────────
    y = sectionHeader(y, 'Détail des Gains et Retenues');
    y += 1;

    const COL1 = MARGIN;
    const COL2 = MARGIN + INNER_W * 0.38;
    const COL3 = MARGIN + INNER_W * 0.50;
    const COL4 = MARGIN + INNER_W * 0.88;
    const W1 = INNER_W * 0.38;
    const W2 = INNER_W * 0.12;
    const W3 = INNER_W * 0.38;
    const W4 = INNER_W * 0.12;
    const ROW_H = 15;

    // ── En-têtes colonnes ──
    doc.rect(COL1, y, INNER_W, ROW_H).fill(BLACK);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
    doc.text('GAINS', COL1 + 5, y + 4, { width: W1 });
    doc.text('Montant', COL2 + 2, y + 4, { width: W2, align: 'right' });
    doc.moveTo(COL3, y).lineTo(COL3, y + ROW_H).strokeColor('#555').lineWidth(0.5).stroke();
    doc.text('RETENUES', COL3 + 5, y + 4, { width: W3 });
    doc.text('Montant', COL4 + 2, y + 4, { width: W4, align: 'right' });
    y += ROW_H;

    // ── Données gains / retenues ──
    const gains = [
      ['Salaire de base', fmt(fiche.salaire_base)],
      ['Prime de transport', fmt(fiche.prime_transport)],
      ['Prime de logement', fmt(fiche.prime_logement)],
      ['Prime de performance', fmt(fiche.prime_performance)],
      ['Prime exceptionnelle', fmt(fiche.prime_exceptionnelle)],
      ['Autres primes', fmt(fiche.autres_primes)],
      ['Heures supplémentaires', fmt(fiche.montant_heures_supp)],
    ];

    const retenues = [
      ['IPRES', fmt(fiche.montant_ipres)],
      ['CSS', fmt(fiche.montant_css)],
      ['Impôt sur le revenu', fmt(fiche.montant_ir)],
      ['Avance sur salaire', fmt(fiche.montant_avance_salaire)],
      ['Assurance', fmt(fiche.montant_assurance)],
      ['Autres retenues', fmt(fiche.montant_retenue)],
      ['', ''],
    ];

    const maxRows = Math.max(gains.length, retenues.length);

    for (let i = 0; i < maxRows; i++) {
      const bg = i % 2 === 0 ? '#FFFFFF' : NEAR_WHITE;
      doc.rect(COL1, y, INNER_W, ROW_H).fill(bg);

      const g = gains[i] || ['', ''];
      const r = retenues[i] || ['', ''];

      // Gains
      doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        .text(g[0], COL1 + 5, y + 4, { width: W1 - 10, ellipsis: true });
      doc.font('Helvetica-Bold')
        .text(g[1], COL2 + 2, y + 4, { width: W2, align: 'right' });

      // Séparateur vertical
      doc.moveTo(COL3, y).lineTo(COL3, y + ROW_H)
        .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

      // Retenues
      doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        .text(r[0], COL3 + 5, y + 4, { width: W3 - 10, ellipsis: true });
      doc.font('Helvetica-Bold')
        .text(r[1], COL4 + 2, y + 4, { width: W4, align: 'right' });

      y += ROW_H;
    }

    // ── Bordure externe tableau ──
    const tableTop = y - maxRows * ROW_H - ROW_H;
    doc.rect(COL1, tableTop, INNER_W, maxRows * ROW_H + ROW_H)
      .strokeColor(LIGHT_GRAY).lineWidth(0.4).stroke();

    // ── Ligne Totaux ──
    doc.rect(COL1, y, INNER_W, ROW_H).fill(LIGHT_GRAY);
    doc.fillColor(BLACK).fontSize(8).font('Helvetica-Bold');
    doc.text('TOTAL GAINS', COL1 + 5, y + 4, { width: W1 - 10 });
    doc.text(fmt(fiche.total_gains), COL2 + 2, y + 4, { width: W2, align: 'right' });
    doc.moveTo(COL3, y).lineTo(COL3, y + ROW_H)
      .strokeColor(MID_GRAY).lineWidth(0.4).stroke();
    doc.text('TOTAL RETENUES', COL3 + 5, y + 4, { width: W3 - 10 });
    doc.text(fmt(fiche.total_retenues), COL4 + 2, y + 4, { width: W4, align: 'right' });
    y += ROW_H;
    y += 4;

    // ── Bandeau Salaire Net ──
    const NET_H = 28;
    doc.rect(MARGIN, y, INNER_W, NET_H).fill(BLACK);
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold')
      .text('SALAIRE NET À PAYER', MARGIN + 12, y + 8, { width: INNER_W * 0.6 });
    doc.fontSize(13)
      .text(fmt(fiche.salaire_net), MARGIN, y + 8, {
        width: INNER_W - 12, align: 'right'
      });
    y += NET_H + 16;

    // ─────────────────────────────────────────
    // SIGNATURES
    // ─────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER_W, y)
      .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
    y += 10;

    const SIG_W = INNER_W / 2 - 10;

    doc.fillColor(MID_GRAY).fontSize(7).font('Helvetica')
      .text("Signature de l'Employeur", MARGIN, y)
      .text("Signature du Salarié", MARGIN + INNER_W / 2, y);

    y += 12;
    doc.fillColor(BLACK).font('Helvetica')
      .text('_'.repeat(36), MARGIN, y)
      .text('_'.repeat(36), MARGIN + INNER_W / 2, y);

    // ─────────────────────────────────────────
    // PIED DE PAGE
    // ─────────────────────────────────────────
    const FOOTER_Y = PAGE_H - 22;
    doc.moveTo(MARGIN, FOOTER_Y).lineTo(MARGIN + INNER_W, FOOTER_Y)
      .strokeColor(LIGHT_GRAY).lineWidth(0.3).stroke();

    doc.fillColor(MID_GRAY).fontSize(6.5).font('Helvetica')
      .text(
        'Ce bulletin de paie est établi conformément à la législation sénégalaise du travail. À conserver sans limitation de durée.',
        MARGIN, FOOTER_Y + 5, { width: INNER_W, align: 'center' }
      );

    doc.end();
  });
};
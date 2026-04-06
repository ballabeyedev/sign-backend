/**
 * contratBailTemplate(data)
 * Génère un buffer .docx pour un contrat de bail noir & blanc.
 *
 * Dépendance : npm install docx
 *
 * @param {Object} data  – structure identique au template original
 * @returns {Promise<Buffer>}
 *
 * Usage :
 *   const generate = require('./contratBailTemplate');
 *   const buf = await generate(data);
 *   fs.writeFileSync('contrat.docx', buf);
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer,
} = require('docx');

module.exports = async function contratBailTemplate(data) {

  const {
    numero_contrat,
    bailleur,
    locataires = [],
    bien,
    bail,
    paiement,
    depot_garantie,
    clauses,
    signature,
  } = data;

  // ── Utilitaires ───────────────────────────────────────────
  const fmt = n => Number(n || 0).toLocaleString('fr-FR');
  const val = v => (v !== undefined && v !== null && v !== '') ? String(v) : '—';
  const today = new Date().toLocaleDateString('fr-FR');

  // ── Palette noir & blanc ──────────────────────────────────
  const BLACK      = "000000";
  const WHITE      = "FFFFFF";
  const LIGHT_GRAY = "F2F2F2";
  const MID_GRAY   = "CCCCCC";
  const DARK_GRAY  = "555555";

  const totalWidth = 9500; // DXA (largeur utile A4 à ~2 cm de marge)

  // ── Bordures ──────────────────────────────────────────────
  const borderFull = {
    top:    { style: BorderStyle.SINGLE, size: 6, color: BLACK },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
    left:   { style: BorderStyle.SINGLE, size: 6, color: BLACK },
    right:  { style: BorderStyle.SINGLE, size: 6, color: BLACK },
  };
  const borderThin = {
    top:    { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY },
    left:   { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY },
    right:  { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY },
  };

  // ── Helpers de mise en forme ──────────────────────────────

  /** Paragraphe vide (espacement vertical) */
  function spacer(pts = 100) {
    return new Paragraph({ spacing: { before: 0, after: pts }, children: [] });
  }

  /** Titre de section : fond noir, texte blanc majuscule */
  function sectionTitle(text) {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      shading: { fill: BLACK, type: ShadingType.CLEAR },
      border: borderFull,
      indent: { left: 120, right: 120 },
      children: [
        new TextRun({ text: text.toUpperCase(), font: "Arial", size: 22, bold: true, color: WHITE }),
      ],
    });
  }

  /** Ligne étiquette / valeur sur deux colonnes */
  function infoRow(label, value, colW = [3500, 6000]) {
    return new Table({
      width: { size: totalWidth, type: WidthType.DXA },
      columnWidths: colW,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: borderThin,
              width: { size: colW[0], type: WidthType.DXA },
              shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: DARK_GRAY })],
              })],
            }),
            new TableCell({
              borders: borderThin,
              width: { size: colW[1], type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: val(value), font: "Arial", size: 20, color: BLACK })],
              })],
            }),
          ],
        }),
      ],
    });
  }

  /** Ligne d'en-tête de tableau (fond noir) */
  function headerRow(cols, widths) {
    return new TableRow({
      children: cols.map((col, i) => new TableCell({
        borders: borderFull,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: BLACK, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: col, font: "Arial", size: 20, bold: true, color: WHITE })],
        })],
      })),
    });
  }

  /** Ligne de données (alternance grise optionnelle) */
  function dataRow(cells, widths, shade = false) {
    return new TableRow({
      children: cells.map((cell, i) => new TableCell({
        borders: borderThin,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: shade ? LIGHT_GRAY : WHITE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: val(cell), font: "Arial", size: 20, color: BLACK })],
        })],
      })),
    });
  }

  /** Ligne de séparation épaisse */
  function thickRule() {
    return new Paragraph({
      spacing: { before: 0, after: 0 },
      border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: BLACK, space: 1 } },
      children: [],
    });
  }

  // ── Contenu du document ───────────────────────────────────
  const children = [];

  // ────────────────────────────────────────────────────────
  // EN-TÊTE / TITRE
  // ────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: "CONTRAT DE BAIL", font: "Arial", size: 56, bold: true, color: BLACK }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: "RÉSIDENTIEL", font: "Arial", size: 28, color: DARK_GRAY })],
    }),
    thickRule(),
    spacer(60),

    // Numéro de contrat + date
    new Table({
      width: { size: totalWidth, type: WidthType.DXA },
      columnWidths: [4750, 4750],
      rows: [new TableRow({
        children: [
          new TableCell({
            borders: borderFull,
            width: { size: 4750, type: WidthType.DXA },
            shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 180, right: 180 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "N° DU CONTRAT", font: "Arial", size: 18, bold: true, color: WHITE })] }),
              new Paragraph({ children: [new TextRun({ text: val(numero_contrat), font: "Arial", size: 24, bold: true, color: WHITE })] }),
            ],
          }),
          new TableCell({
            borders: borderFull,
            width: { size: 4750, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 180, right: 180 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "DATE D'ÉTABLISSEMENT", font: "Arial", size: 18, bold: true, color: DARK_GRAY })] }),
              new Paragraph({ children: [new TextRun({ text: today, font: "Arial", size: 24, bold: true, color: BLACK })] }),
            ],
          }),
        ],
      })],
    }),
    spacer(200),
  );

  // ────────────────────────────────────────────────────────
  // ARTICLE I — PARTIES
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article I — Parties au Contrat"), spacer(80));

  // 1.1 Bailleur
  children.push(new Paragraph({
    spacing: { before: 60, after: 40 },
    children: [new TextRun({ text: "1.1  LE BAILLEUR", font: "Arial", size: 22, bold: true, color: BLACK })],
  }));
  [
    ["Nom & Prénom",              `${val(bailleur.prenom)} ${val(bailleur.nom)}`],
    ["Adresse",                   bailleur.adresse],
    ["Téléphone",                 bailleur.telephone],
    ["Email",                     bailleur.email],
    ["Entreprise / Société",      bailleur.nomEntreprise],
    ["Registre de Commerce (RC)", bailleur.rc],
    ["NINEA",                     bailleur.ninea],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(120));

  // 1.2 Locataires
  children.push(new Paragraph({
    spacing: { before: 60, after: 40 },
    children: [new TextRun({ text: "1.2  LE(S) LOCATAIRE(S)", font: "Arial", size: 22, bold: true, color: BLACK })],
  }));
  locataires.forEach((l, idx) => {
    children.push(new Paragraph({
      spacing: { before: 60, after: 30 },
      children: [new TextRun({ text: `Locataire ${idx + 1}`, font: "Arial", size: 20, bold: true, color: DARK_GRAY, italics: true })],
    }));
    [
      ["Nom & Prénom",       `${val(l.prenom)} ${val(l.nom)}`],
      ["Adresse actuelle",   l.adresse],
      ["Téléphone",          l.telephone],
      ["Email",              l.email],
      ["Numéro CNI",         l.cni],
    ].forEach(([label, value]) => children.push(infoRow(label, value)));
    if (idx < locataires.length - 1) children.push(spacer(80));
  });
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE II — BIEN LOUÉ
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article II — Désignation du Bien Loué"), spacer(80));
  [
    ["Adresse complète",    bien.adresse],
    ["Ville",               bien.ville],
    ["Code Postal",         bien.code_postal],
    ["Pays",                bien.pays],
    ["Type de bien",        bien.type],
    ["Superficie",          bien.superficie ? `${bien.superficie} m²` : null],
    ["Nombre de pièces",    bien.nombre_pieces],
    ["Étage",               bien.etage !== undefined ? `${bien.etage}ème étage` : null],
    ["Meublé",              bien.meuble ? "Oui" : "Non"],
    ["Parking",             bien.parking ? "Oui" : "Non"],
    ["Cave",                bien.cave ? "Oui" : "Non"],
    ["Balcon / Terrasse",   bien.balcon_terrasse ? "Oui" : "Non"],
    ["Usage",               bien.usage],
    ["Description",         bien.description],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE III — DURÉE
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article III — Durée du Bail"), spacer(80));
  [
    ["Date de début",                bail.date_debut],
    ["Durée du bail",                bail.duree],
    ["Date d'échéance",              bail.date_fin],
    ["Renouvellement automatique",   bail.renouvelable ? "Oui" : "Non"],
    ["Délai de préavis",             bail.duree_preavis],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE IV — LOYER & CHARGES
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article IV — Loyer & Charges"), spacer(80));

  const devise = paiement.devise || 'FCFA';
  const wPay   = [4750, 2375, 2375];
  const totalMensuel =
    (paiement.montant_loyer || 0) +
    (paiement.montant_charges || 0) +
    (paiement.autres_charges || []).reduce((a, c) => a + (c.montant || 0), 0);

  children.push(
    new Table({
      width: { size: totalWidth, type: WidthType.DXA },
      columnWidths: wPay,
      rows: [
        headerRow(["DÉSIGNATION", "MONTANT", "DEVISE"], wPay),
        dataRow(["Loyer mensuel de base", fmt(paiement.montant_loyer), devise], wPay, false),
        dataRow(["Charges locatives",     fmt(paiement.montant_charges || 0), devise], wPay, true),
        ...(paiement.autres_charges || []).map((c, i) =>
          dataRow([c.label, fmt(c.montant), devise], wPay, i % 2 === 0)
        ),
        // Ligne total
        new TableRow({
          children: [
            new TableCell({
              borders: borderFull,
              width: { size: wPay[0], type: WidthType.DXA },
              shading: { fill: BLACK, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: "TOTAL MENSUEL DÛ", font: "Arial", size: 22, bold: true, color: WHITE })],
              })],
            }),
            new TableCell({
              borders: borderFull,
              width: { size: wPay[1] + wPay[2], type: WidthType.DXA },
              shading: { fill: BLACK, type: ShadingType.CLEAR },
              columnSpan: 2,
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${fmt(totalMensuel)} ${devise}`, font: "Arial", size: 24, bold: true, color: WHITE })],
              })],
            }),
          ],
        }),
      ],
    }),
    spacer(80),
  );
  [
    ["Charges incluses dans le loyer", paiement.charges_incluses ? "Oui" : "Non"],
    ["Jour d'exigibilité du loyer",    `Le ${val(paiement.jour_paiement)} de chaque mois`],
    ["Périodicité",                    paiement.periodicite],
    ["Mode de paiement",               paiement.moyen],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE V — DÉPÔT DE GARANTIE
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article V — Dépôt de Garantie"), spacer(80));
  [
    ["Dépôt de garantie prévu", depot_garantie?.prevu ? "Oui" : "Non"],
    ["Montant du dépôt",        `${fmt(depot_garantie?.montant || 0)} ${devise}`],
    ["Date de versement",       depot_garantie?.date_versement],
    ["Mode de paiement",        depot_garantie?.mode_paiement],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(80));
  children.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({
      text: "Le dépôt de garantie sera restitué dans un délai maximum de deux (2) mois suivant la remise des clés, déduction faite des sommes dues par le locataire et des éventuels frais de remise en état.",
      font: "Arial", size: 19, color: DARK_GRAY, italics: true,
    })],
  }));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE VI — CLAUSES
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article VI — Clauses & Conditions Particulières"), spacer(80));
  [
    ["Sous-location",           clauses?.sous_location],
    ["Animaux de compagnie",    clauses?.animaux],
    ["Travaux & modifications", clauses?.travaux],
    ["Clauses particulières",   clauses?.personnalisees],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE VII — OBLIGATIONS
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article VII — Obligations des Parties"), spacer(80));
  [
    ["Obligations du bailleur",   "Assurer au locataire la jouissance paisible du bien loué, entretenir les locaux en bon état et effectuer les réparations nécessaires autres que locatives."],
    ["Obligations du locataire",  "Payer le loyer aux termes convenus, user paisiblement des locaux, assurer les réparations locatives, souscrire une assurance habitation et en remettre l'attestation au bailleur."],
    ["Assurance obligatoire",     "Le locataire est tenu de souscrire une assurance multirisques habitation couvrant les risques locatifs avant son entrée dans les lieux."],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE VIII — RÉSILIATION
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article VIII — Résiliation du Contrat"), spacer(80));
  children.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Le présent contrat pourra être résilié dans les cas suivants :", font: "Arial", size: 20, color: BLACK })],
  }));
  [
    ["Résiliation par le locataire", `Préavis de ${val(bail.duree_preavis)} adressé par lettre recommandée avec accusé de réception.`],
    ["Résiliation par le bailleur",  "En cas de non-paiement du loyer ou des charges, après mise en demeure restée sans effet pendant 30 jours."],
    ["Résiliation judiciaire",       "En cas de manquement grave aux obligations contractuelles, par voie judiciaire conformément à la législation en vigueur."],
  ].forEach(([l, v]) => children.push(infoRow(l, v)));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE IX — DROIT APPLICABLE
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article IX — Droit Applicable & Litiges"), spacer(80));
  children.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({
      text: "Le présent contrat est régi par la législation sénégalaise en matière de baux à usage d'habitation. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du ressort du lieu de situation du bien loué.",
      font: "Arial", size: 20, color: BLACK,
    })],
  }));
  children.push(spacer(200));

  // ────────────────────────────────────────────────────────
  // ARTICLE X — SIGNATURES
  // ────────────────────────────────────────────────────────
  children.push(sectionTitle("Article X — Signatures"), spacer(100));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({
        text: `Fait à ${val(signature?.ville)}, le ${val(signature?.date) !== '—' ? signature.date : today}`,
        font: "Arial", size: 22, bold: true, color: BLACK,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({
        text: "En deux (2) exemplaires originaux, dont un remis à chaque partie.",
        font: "Arial", size: 19, color: DARK_GRAY, italics: true,
      })],
    }),
  );

  const wSig = [4750, 4750];
  children.push(new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: wSig,
    rows: [
      // En-têtes
      new TableRow({
        children: [
          new TableCell({
            borders: borderFull, width: { size: wSig[0], type: WidthType.DXA },
            shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LE BAILLEUR", font: "Arial", size: 22, bold: true, color: WHITE })] })],
          }),
          new TableCell({
            borders: borderFull, width: { size: wSig[1], type: WidthType.DXA },
            shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LE(S) LOCATAIRE(S)", font: "Arial", size: 22, bold: true, color: WHITE })] })],
          }),
        ],
      }),
      // Noms
      new TableRow({
        children: [
          new TableCell({
            borders: borderThin, width: { size: wSig[0], type: WidthType.DXA },
            margins: { top: 80, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: `${val(bailleur.prenom)} ${val(bailleur.nom)}`, font: "Arial", size: 20, bold: true, color: BLACK })] })],
          }),
          new TableCell({
            borders: borderThin, width: { size: wSig[1], type: WidthType.DXA },
            margins: { top: 80, bottom: 60, left: 120, right: 120 },
            children: locataires.map(l => new Paragraph({
              children: [new TextRun({ text: `${val(l.prenom)} ${val(l.nom)}`, font: "Arial", size: 20, bold: true, color: BLACK })],
            })),
          }),
        ],
      }),
      // Zone de signature (hauteur pour écrire)
      new TableRow({
        children: [
          new TableCell({
            borders: borderThin, width: { size: wSig[0], type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: "Signature & cachet :", font: "Arial", size: 18, color: DARK_GRAY })] })],
          }),
          new TableCell({
            borders: borderThin, width: { size: wSig[1], type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: "Signature(s) :", font: "Arial", size: 18, color: DARK_GRAY })] })],
          }),
        ],
      }),
    ],
  }));
  children.push(spacer(200));

  // Pied de page interne
  children.push(thickRule());
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 0 },
    children: [new TextRun({
      text: `Contrat N° ${val(numero_contrat)}  ·  ${val(bailleur.nomEntreprise) !== '—' ? bailleur.nomEntreprise : `${val(bailleur.prenom)} ${val(bailleur.nom)}`}  ·  Document confidentiel`,
      font: "Arial", size: 17, color: DARK_GRAY,
    })],
  }));

  // ── Assemblage du document ────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20, color: BLACK },
          paragraph: { spacing: { after: 0 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2 cm
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY, space: 1 } },
              spacing: { before: 0, after: 80 },
              children: [
                new TextRun({ text: `CONTRAT DE BAIL  —  N° ${val(numero_contrat)}`, font: "Arial", size: 17, color: DARK_GRAY }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY, space: 1 } },
              spacing: { before: 80, after: 0 },
              children: [
                new TextRun({ text: `${val(numero_contrat)}  ·  Document confidentiel`, font: "Arial", size: 17, color: DARK_GRAY }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
};
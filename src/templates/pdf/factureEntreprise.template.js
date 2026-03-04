module.exports = function invoiceTemplate(data) {

  const {
    numeroFacture,
    nomClient,
    cniClient,
    nomUtilisateur,
    telephone,
    email,
    logo,
    rc,
    ninea,
    delais_execution,
    date_execution,
    avance = 0,
    lieu_execution,
    montant,
    moyen_paiement,
    items,
    dateGeneration,
    signature,
    nomEntreprise,
    adresseEntreprise,
    telephoneEntreprise,
    emailEntreprise,
    tva
  } = data;

  const TVA_RATE = (Number(tva) || 0) / 100;
  const totalHT = Number(montant) || 0;
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;
  const totalAPayer = totalTTC - Number(avance);

  const format = n => Number(n || 0).toLocaleString('fr-FR');
  const today = new Date().toLocaleDateString('fr-FR');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
@page { size: A4; margin: 16mm 18mm; }

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', Arial, sans-serif;
  color: #111;
  font-size: 12.5px;
  background: #fff;
  line-height: 1.5;
}

/* ── RESET TABLES ── */
table { border-collapse: collapse; }
td, th { padding: 0; vertical-align: top; }

/* ── TYPOGRAPHY ── */
.title-word {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1;
  text-transform: uppercase;
  color: #111;
  text-align: center;
}

.title-underline {
  width: 60px;
  height: 2px;
  background: #111;
  margin: 6px auto 0;
}

.info-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 5px;
}

/* ── DIVIDERS ── */
.hr-light { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
.hr-thick { border: none; border-top: 2px solid #111; margin: 16px 0; }

/* ── SECTION TAG ── */
.section-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  background: #111;
  padding: 3px 10px;
  margin-bottom: 8px;
}

/* ── META BADGE ── */
.meta-cell {
  border: 1px solid #ddd;
  background: #fafafa;
  padding: 5px 10px;
}
.meta-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #888;
  white-space: nowrap;
  padding-right: 12px;
}
.meta-val {
  font-size: 12px;
  font-weight: 500;
  color: #111;
  text-align: right;
}

/* ── ITEMS TABLE ── */
.items-table { width: 100%; margin-top: 16px; }

.items-table thead tr { background: #111; }
.items-table thead th {
  padding: 10px 12px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #fff;
  border: none;
  text-align: left;
}
.items-table thead th.right { text-align: right; }

.items-table tbody td {
  padding: 10px 12px;
  font-size: 12.5px;
  color: #222;
  border-bottom: 1px solid #e8e8e8;
}
.items-table tbody tr:last-child td { border-bottom: 2px solid #111; }
.items-table tbody tr:nth-child(even) td { background: #f8f8f8; }
.items-table tbody td.right { text-align: right; }

/* ── TOTALS TABLE ── */
.totals-table { width: 48%; margin-left: auto; margin-top: 16px; border: 1px solid #ddd; }

.totals-table td {
  padding: 8px 14px;
  font-size: 12.5px;
  border-bottom: 1px solid #e8e8e8;
  vertical-align: middle;
}
.totals-table tr:last-child td { border-bottom: none; }
.totals-table .amount { text-align: right; }

.row-ttc td { background: #f0f0f0; font-weight: 600; font-size: 13px; }
.row-sep td { padding: 0 !important; height: 0 !important; line-height: 0; border-top: 1.5px solid #111 !important; border-bottom: none !important; }
.row-reste td {
  background: #111;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  border-bottom: none;
}

/* ── PAYMENT ── */
.payment-wrap { margin-top: 14px; }
.payment-table { border: 1.5px solid #111; }
.payment-table td { vertical-align: middle; }
.pay-label {
  background: #111;
  color: #fff;
  padding: 7px 14px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
}
.pay-val {
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
}

/* ── SIGNATURE ── */
.sig-line {
  width: 140px;
  height: 60px;
  border-bottom: 1.5px solid #333;
  display: block;
  margin-left: auto;
  margin-bottom: 6px;
}
.sig-label {
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  font-weight: 600;
  text-align: right;
  padding-top: 5px;
}

/* ── FOOTER ── */
.page-footer {
  text-align: center;
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid #ddd;
  font-size: 10px;
  color: #aaa;
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>
</head>
<body>

<!-- ══ HEADER ══════════════════════════════════════════ -->
<table width="100%" style="border-bottom: 3px solid #111; padding-bottom: 18px;">
  <tr>
    <td width="120" valign="middle">
      ${logo
        ? `<img src="${logo}" style="width:110px; height:72px; object-fit:contain; border:1.5px solid #111; display:block;" />`
        : `<table width="110" height="72" style="border:1.5px solid #111;"><tr><td align="center" valign="middle" style="font-size:10px;color:#888;letter-spacing:1px;text-transform:uppercase;">LOGO</td></tr></table>`
      }
    </td>
    <td valign="middle" align="center">
      <div class="title-word">Facture</div>
      <div class="title-underline"></div>
    </td>
    <td width="120"></td>
  </tr>
</table>

<!-- ══ ÉMETTEUR / ENTREPRISE ═══════════════════════════ -->
<hr class="hr-light">
<table width="100%">
  <tr>
    <td width="50%" valign="top" style="padding-right:20px;">
      <div class="info-label">Émetteur</div>
      <strong style="font-size:13.5px;">${nomUtilisateur}</strong><br>
      ${telephone || ''}<br>
      ${email || ''}
    </td>
    <td width="50%" valign="top" align="right">
      <div class="info-label">Entreprise</div>
      <strong style="font-size:13.5px;">${nomEntreprise || '-'}</strong><br>
      ${adresseEntreprise || ''}<br>
      ${telephoneEntreprise || ''}<br>
      ${emailEntreprise || ''}<br>
      RC&nbsp;: ${rc || '-'} &nbsp;·&nbsp; NINEA&nbsp;: ${ninea || '-'}
    </td>
  </tr>
</table>
<hr class="hr-thick">

<!-- ══ CLIENT & META ════════════════════════════════════ -->
<table width="100%">
  <tr>
    <td width="44%" valign="top" style="padding-right:16px;">
      <div class="section-tag">Client</div><br>
      <strong style="font-size:13.5px;">${nomClient}</strong><br>
      CNI&nbsp;: ${cniClient || '-'}
    </td>
    <td width="56%" valign="top">
      <table width="100%">
        <tr>
          <td width="50%" style="padding:0 0 5px 4px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">N° Facture</td>
                <td class="meta-val">${numeroFacture}</td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding:0 0 5px 5px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">Date</td>
                <td class="meta-val">${dateGeneration}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:0 0 0 4px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">Délai</td>
                <td class="meta-val">${delais_execution}</td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding:0 0 0 5px;">
            <table width="100%" class="meta-cell">
              <tr>
                <td class="meta-label">Date exécution</td>
                <td class="meta-val">${date_execution}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ══ TABLE PRODUITS ═══════════════════════════════════ -->
<table class="items-table">
  <thead>
    <tr>
      <th>Désignation</th>
      <th class="right" width="60">Qté</th>
      <th class="right" width="140">Prix Unitaire</th>
      <th class="right" width="140">Total</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td>${i.designation}</td>
      <td class="right">${i.quantite}</td>
      <td class="right">${format(i.prix_unitaire)} FCFA</td>
      <td class="right">${format(i.quantite * i.prix_unitaire)} FCFA</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<!-- ══ TOTAUX ═══════════════════════════════════════════ -->
<table class="totals-table">
  <tr>
    <td>Total HT</td>
    <td class="amount">${format(totalHT)} FCFA</td>
  </tr>
  <tr>
    <td>TVA (${TVA_RATE * 100}%)</td>
    <td class="amount">${format(tvaAmount)} FCFA</td>
  </tr>
  <tr class="row-ttc">
    <td>Total TTC</td>
    <td class="amount">${format(totalTTC)} FCFA</td>
  </tr>
  <tr class="row-sep"><td colspan="2"></td></tr>
  <tr>
    <td>Avance versée</td>
    <td class="amount">${format(avance)} FCFA</td>
  </tr>
  <tr class="row-reste">
    <td>Reste à payer</td>
    <td class="amount">${format(totalAPayer)} FCFA</td>
  </tr>
</table>

<!-- ══ MODE DE PAIEMENT ═════════════════════════════════ -->
<div class="payment-wrap">
  <table class="payment-table">
    <tr>
      <td class="pay-label">Mode de paiement</td>
      <td class="pay-val">${moyen_paiement}</td>
    </tr>
  </table>
</div>

<!-- ══ BAS DE PAGE ══════════════════════════════════════ -->
<table width="100%" style="margin-top:32px;">
  <tr>
    <td valign="bottom">
      <div style="font-size:12px; color:#444; line-height:2.2;">
        <span style="font-weight:600; color:#111;">Lieu :</span> ${lieu_execution || '-'}<br>
        <span style="font-weight:600; color:#111;">Date :</span> ${today}
      </div>
    </td>
    <td valign="bottom" align="right">
      ${signature
        ? `<img src="${signature}" style="max-width:140px; max-height:70px; display:block; margin-left:auto; margin-bottom:6px;" />`
        : `<div class="sig-line"></div>`
      }
      <div class="sig-label">Cachet &amp; Signature</div>
    </td>
  </tr>
</table>

<!-- ══ FOOTER ═══════════════════════════════════════════ -->
<div class="page-footer">
  Facture générée par SIGN &nbsp;·&nbsp; ${new Date().getFullYear()}
</div>

</body>
</html>
`;
};
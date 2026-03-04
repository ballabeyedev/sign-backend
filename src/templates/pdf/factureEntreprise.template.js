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
  } = data;

  const TVA_RATE = 0.18;
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
@page { size:A4; margin:16mm 18mm; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  color: #111;
  font-size: 12.5px;
  background: #fff;
  line-height: 1.5;
}

/* ── HEADER ─────────────────────────────────────────── */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 3px solid #111;
}

.logo-box {
  width: 110px;
  height: 72px;
  border: 1.5px solid #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.logo-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.title-block {
  text-align: center;
}

.title-word {
  font-family: 'Playfair Display', serif;
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1;
  text-transform: uppercase;
  color: #111;
}

.title-line {
  display: block;
  width: 60px;
  height: 2px;
  background: #111;
  margin: 6px auto 0;
}

.header-spacer { width: 110px; }

/* ── DIVIDER ─────────────────────────────────────────── */
.divider {
  border: none;
  border-top: 1px solid #ccc;
  margin: 18px 0;
}

.divider-thick {
  border: none;
  border-top: 2px solid #111;
  margin: 18px 0;
}

/* ── INFO ROWS ───────────────────────────────────────── */
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.info-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 4px;
}

.info-value {
  font-size: 12.5px;
  color: #111;
  line-height: 1.6;
}

.info-value strong {
  font-weight: 600;
  font-size: 13.5px;
}

.text-right { text-align: right; }

/* ── META BADGES ─────────────────────────────────────── */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: #fafafa;
}

.meta-item span:first-child {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #888;
}

.meta-item span:last-child {
  font-size: 12px;
  font-weight: 500;
  color: #111;
}

/* ── TABLE ───────────────────────────────────────────── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.items-table thead tr {
  background: #111;
  color: #fff;
}

.items-table thead th {
  padding: 10px 12px;
  text-align: left;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border: none;
}

.items-table thead th:last-child,
.items-table thead th:nth-child(2),
.items-table thead th:nth-child(3) {
  text-align: right;
}

.items-table tbody tr {
  border-bottom: 1px solid #e8e8e8;
}

.items-table tbody tr:last-child {
  border-bottom: 2px solid #111;
}

.items-table tbody td {
  padding: 10px 12px;
  font-size: 12.5px;
  color: #222;
  border: none;
}

.items-table tbody td:last-child,
.items-table tbody td:nth-child(2),
.items-table tbody td:nth-child(3) {
  text-align: right;
}

.items-table tbody tr:nth-child(even) {
  background: #f8f8f8;
}

/* ── TOTALS ──────────────────────────────────────────── */
.totals-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.totals-box {
  width: 52%;
  border: 1px solid #ddd;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12.5px;
}

.totals-row:last-child { border-bottom: none; }

.totals-row.ttc {
  background: #f0f0f0;
  font-weight: 600;
  font-size: 13px;
}

.totals-divider {
  border: none;
  border-top: 1.5px solid #111;
  margin: 0;
}

.totals-row.reste {
  background: #111;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  letter-spacing: 0.3px;
}

/* ── PAYMENT ─────────────────────────────────────────── */
.payment-row {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-top: 14px;
  border: 1.5px solid #111;
}

.payment-label {
  background: #111;
  color: #fff;
  padding: 7px 14px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.payment-value {
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 500;
  color: #111;
}

/* ── FOOTER ROW ──────────────────────────────────────── */
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 32px;
}

.lieu-date-block {
  font-size: 12px;
  color: #444;
  line-height: 2;
}

.lieu-date-block strong {
  color: #111;
  font-weight: 600;
}

.signature-block {
  text-align: right;
}

.signature-img {
  max-width: 140px;
  max-height: 70px;
  display: block;
  margin-left: auto;
  margin-bottom: 6px;
}

.sig-placeholder {
  width: 140px;
  height: 60px;
  border-bottom: 1.5px solid #333;
  margin-left: auto;
  margin-bottom: 6px;
}

.sig-label {
  font-size: 9.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  font-weight: 600;
}

/* ── PAGE FOOTER ─────────────────────────────────────── */
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

/* ── SECTION TITLE ───────────────────────────────────── */
.section-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  background: #111;
  padding: 3px 10px;
  margin-bottom: 10px;
}
</style>
</head>

<body>

<!-- ══ HEADER ══════════════════════════════════════════ -->
<div class="header">
  <div class="logo-box">
    ${logo ? `<img src="${logo}" />` : 'LOGO'}
  </div>

  <div class="title-block">
    <div class="title-word">Facture</div>
    <span class="title-line"></span>
  </div>

  <div class="header-spacer"></div>
</div>

<!-- ══ ENTREPRISE & UTILISATEUR ════════════════════════ -->
<hr class="divider">

<div class="info-row">
  <div>
    <div class="info-label">Émetteur</div>
    <div class="info-value">
      <strong>${nomUtilisateur}</strong><br>
      ${telephone || ''}<br>
      ${email || ''}
    </div>
  </div>

  <div class="text-right">
    <div class="info-label">Entreprise</div>
    <div class="info-value">
      <strong>${nomEntreprise || '-'}</strong><br>
      ${adresseEntreprise || ''}<br>
      ${telephoneEntreprise || ''}<br>
      ${emailEntreprise || ''}<br>
      RC&nbsp;: ${rc || '-'} &nbsp;·&nbsp; NINEA&nbsp;: ${ninea || '-'}
    </div>
  </div>
</div>

<hr class="divider-thick">

<!-- ══ CLIENT & META ════════════════════════════════════ -->
<div class="info-row" style="align-items:flex-start;">
  <div>
    <div class="section-tag">Client</div>
    <div class="info-value">
      <strong>${nomClient}</strong><br>
      CNI&nbsp;: ${cniClient || '-'}
    </div>
  </div>

  <div style="min-width:280px;">
    <div class="meta-grid">
      <div class="meta-item">
        <span>N° Facture</span>
        <span>${numeroFacture}</span>
      </div>
      <div class="meta-item">
        <span>Date</span>
        <span>${dateGeneration}</span>
      </div>
      <div class="meta-item">
        <span>Délai</span>
        <span>${delais_execution}</span>
      </div>
      <div class="meta-item">
        <span>Date exécution</span>
        <span>${date_execution}</span>
      </div>
    </div>
  </div>
</div>

<!-- ══ TABLE PRODUITS ═══════════════════════════════════ -->
<table class="items-table">
  <thead>
    <tr>
      <th>Désignation</th>
      <th>Qté</th>
      <th>Prix Unitaire</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td>${i.designation}</td>
      <td>${i.quantite}</td>
      <td>${format(i.prix_unitaire)} FCFA</td>
      <td>${format(i.quantite * i.prix_unitaire)} FCFA</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<!-- ══ TOTAUX ═══════════════════════════════════════════ -->
<div class="totals-wrapper">
  <div class="totals-box">
    <div class="totals-row">
      <span>Total HT</span>
      <span>${format(totalHT)} FCFA</span>
    </div>
    <div class="totals-row">
      <span>TVA (${TVA_RATE * 100}%)</span>
      <span>${format(tvaAmount)} FCFA</span>
    </div>
    <div class="totals-row ttc">
      <span>Total TTC</span>
      <span>${format(totalTTC)} FCFA</span>
    </div>
    <hr class="totals-divider">
    <div class="totals-row">
      <span>Avance versée</span>
      <span>${format(avance)} FCFA</span>
    </div>
    <div class="totals-row reste">
      <span>Reste à payer</span>
      <span>${format(totalAPayer)} FCFA</span>
    </div>
  </div>
</div>

<!-- ══ MODE DE PAIEMENT ═════════════════════════════════ -->
<div>
  <div class="payment-row">
    <div class="payment-label">Mode de paiement</div>
    <div class="payment-value">${moyen_paiement}</div>
  </div>
</div>

<!-- ══ BAS DE PAGE ══════════════════════════════════════ -->
<div class="bottom-row">
  <div class="lieu-date-block">
    <div><strong>Lieu :</strong> ${lieu_execution || '-'}</div>
    <div><strong>Date :</strong> ${today}</div>
  </div>

  <div class="signature-block">
    ${signature
      ? `<img src="${signature}" class="signature-img" />`
      : `<div class="sig-placeholder"></div>`
    }
    <div class="sig-label">Cachet &amp; Signature</div>
  </div>
</div>

<!-- ══ FOOTER ═══════════════════════════════════════════ -->
<div class="page-footer">
  Facture générée par SIGN &nbsp;·&nbsp; ${new Date().getFullYear()}
</div>

</body>
</html>
`;
};
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
    avance,
    lieu_execution,
    montant,          // Montant total TTC (ici = HT car pas de TVA)
    moyen_paiement,
    items,
    dateGeneration
  } = data;

  const totalAPayer = montant - (avance || 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${numeroFacture}</title>
  <style>
    /* (Garder le même CSS que précédemment) */
    body {
      font-family: 'Helvetica', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      line-height: 1.4;
    }
    .invoice-box {
      max-width: 800px;
      margin: auto;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      padding: 30px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 20px;
    }
    .company-info {
      width: 60%;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }
    .company-details {
      font-size: 12px;
      color: #7f8c8d;
    }
    .invoice-title {
      text-align: right;
      width: 35%;
    }
    .invoice-title h2 {
      color: #2c3e50;
      margin: 0;
    }
    .invoice-title .invoice-number {
      font-size: 16px;
      font-weight: bold;
    }
    .client-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .client-box, .pro-box {
      width: 48%;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
    }
    .client-box h4, .pro-box h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #2c3e50;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      width: 120px;
    }
    .info-value {
      flex: 1;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    table.items th {
      background: #2c3e50;
      color: white;
      padding: 10px;
      font-size: 14px;
      text-align: left;
    }
    table.items td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    table.items tr:last-child td {
      border-bottom: none;
    }
    .amount-right {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .totals-table {
      width: 300px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 10px;
    }
    .totals-table .label {
      font-weight: bold;
    }
    .totals-table .total-montant {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }
    .payment-section {
      margin-top: 30px;
      border-top: 2px dashed #2c3e50;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
    }
    .payment-box {
      width: 45%;
    }
    .payment-box h4 {
      margin-top: 0;
      color: #2c3e50;
    }
    .payment-row {
      display: flex;
      margin-bottom: 8px;
    }
    .payment-label {
      font-weight: bold;
      width: 120px;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #7f8c8d;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- En‑tête -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">${nomUtilisateur || 'AUCHAN'}</div>
        <div class="company-details">
          ${telephone ? 'Tél : ' + telephone : ''}<br>
          ${email ? 'Email : ' + email : ''}<br>
          RC : ${rc || 'N/A'}<br>
          NINEA : ${ninea || 'N/A'}
        </div>
      </div>
      <div class="invoice-title">
        <h2>FACTURE</h2>
        <div class="invoice-number">N° ${numeroFacture}</div>
        <div>Date : ${dateGeneration}</div>
      </div>
    </div>

    <!-- Informations client / professionnel -->
    <div class="client-section">
      <div class="client-box">
        <h4>CLIENT</h4>
        <div class="info-row">
          <span class="info-label">Nom :</span>
          <span class="info-value">${nomClient}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CNI :</span>
          <span class="info-value">${cniClient}</span>
        </div>
      </div>
      <div class="pro-box">
        <h4>DETAILS</h4>
        <div class="info-row">
          <span class="info-label">Délai exécution :</span>
          <span class="info-value">${delais_execution}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date exécution :</span>
          <span class="info-value">${date_execution}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lieu :</span>
          <span class="info-value">${lieu_execution}</span>
        </div>
      </div>
    </div>

    <!-- Tableau des produits -->
    <table class="items">
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Qté</th>
          <th>Prix unitaire (FCFA)</th>
          <th>Total (FCFA)</th>   <!-- Modifié : suppression de "HT" -->
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.designation}</td>
            <td>${item.quantite}</td>
            <td class="amount-right">${Number(item.prix_unitaire).toLocaleString('fr-FR')}</td>
            <td class="amount-right">${(item.quantite * item.prix_unitaire).toLocaleString('fr-FR')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totaux : une seule ligne "Total" sans TVA -->
    <div class="totals">
      <table class="totals-table">
        <tr>
          <td class="label total-montant">Total :</td>
          <td class="amount-right total-montant">${montant.toLocaleString('fr-FR')} FCFA</td>
        </tr>
      </table>
    </div>

    <!-- Mode de paiement & avance -->
    <div class="payment-section">
      <div class="payment-box">
        <h4>Mode de paiement</h4>
        <div class="payment-row">
          <span class="payment-label">Mode :</span>
          <span>${moyen_paiement}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">Avance :</span>
          <span>${avance ? avance.toLocaleString('fr-FR') + ' FCFA' : '0 FCFA'}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">Reste à payer :</span>
          <span><strong>${totalAPayer.toLocaleString('fr-FR')} FCFA</strong></span>
        </div>
      </div>
      <div class="payment-box">
        <h4>Observations</h4>
        <p style="margin:0; font-style:italic;">-</p>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      Lieu : Dakar, le ${dateGeneration}
    </div>
  </div>
</body>
</html>
  `;
};
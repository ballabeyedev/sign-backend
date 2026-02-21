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
    dateGeneration
  } = data;

  const totalHT = montant;
  const TVA_RATE = 0; // changer si TVA utilisée
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;
  const totalAPayer = totalTTC - avance;

  const format = n => Number(n || 0).toLocaleString('fr-FR');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${numeroFacture}</title>

<style>
@page { size:A4; margin:18mm 15mm; }

body{
  font-family: Arial, Helvetica, sans-serif;
  font-size:13px;
  color:#111;
  background:#fff;
}

.page{
  width:210mm;
  min-height:297mm;
  margin:auto;
}

.top{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
}

.logo-box{
  width:42mm;
  height:32mm;
  border:1.5px solid #333;
  display:flex;
  align-items:center;
  justify-content:center;
}

.logo-box img{
  max-width:100%;
  max-height:100%;
}

.title{
  flex:1;
  text-align:center;
  font-size:42px;
  font-weight:700;
}

.hr{
  border:0;
  border-top:1px solid #333;
  margin:10mm 0 6mm;
}

.company{
  display:flex;
  justify-content:space-between;
}

.company .name{
  font-weight:bold;
  font-size:16px;
}

.meta{
  display:flex;
  justify-content:space-between;
  margin:8mm 0;
}

.block-title{
  font-weight:bold;
  margin-bottom:4px;
}

table{
  width:100%;
  border-collapse:collapse;
}

th, td{
  border:1px solid #333;
  padding:8px;
}

th{
  background:#f2f2f2;
}

.totals{
  width:50%;
  margin-left:auto;
  margin-top:6mm;
}

.totals div{
  display:flex;
  justify-content:space-between;
  border:1px solid #333;
  border-top:0;
  padding:6px 10px;
}

.totals div:first-child{
  border-top:1px solid #333;
}

.payment{
  border:1px solid #333;
  margin-top:8mm;
}

.payment-row{
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid #333;
  padding:8px 10px;
}

.payment-row:last-child{
  border-bottom:0;
}

.bottom{
  display:flex;
  justify-content:space-between;
  margin-top:12mm;
}

.sign{
  margin-top:18mm;
  text-align:right;
}

.sign-line{
  width:70mm;
  border-top:1px solid #333;
  margin-top:10mm;
}

.footer{
  text-align:center;
  margin-top:14mm;
  font-size:12px;
}
</style>
</head>

<body>
<div class="page">

  <div class="top">
    <div class="logo-box">
      ${logo ? `<img src="${logo}" />` : ''}
    </div>
    <div class="title">FACTURE</div>
    <div style="width:42mm;"></div>
  </div>

  <hr class="hr">

  <div class="company">
    <div>
      <div class="name">${nomUtilisateur}</div>
      <div>${telephone || ''}</div>
      <div>${email || ''}</div>
    </div>
    <div style="text-align:right">
      <div><strong>RC :</strong> ${rc || '-'}</div>
      <div><strong>NINEA :</strong> ${ninea || '-'}</div>
    </div>
  </div>

  <hr class="hr">

  <div class="meta">
    <div>
      <div class="block-title">CLIENT</div>
      <div>${nomClient}</div>
      <div>CNI : ${cniClient}</div>
    </div>

    <div style="text-align:right">
      <div><strong>Facture N° :</strong> ${numeroFacture}</div>
      <div><strong>Date :</strong> ${dateGeneration}</div>
      <div><strong>Délai :</strong> ${delais_execution}</div>
      <div><strong>Date exécution :</strong> ${date_execution}</div>
    </div>
  </div>

  <table>
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
          <td align="center">${i.quantite}</td>
          <td align="right">${format(i.prix_unitaire)} FCFA</td>
          <td align="right">${format(i.quantite * i.prix_unitaire)} FCFA</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Total HT</span><span>${format(totalHT)} FCFA</span></div>
    <div><span>TVA</span><span>${format(tvaAmount)} FCFA</span></div>
    <div><strong>Total TTC</strong><strong>${format(totalTTC)} FCFA</strong></div>
  </div>

  <div class="payment">
    <div class="payment-row">
      <span>Mode de paiement</span>
      <strong>${moyen_paiement}</strong>
    </div>
    <div class="payment-row">
      <span>Avance</span>
      <strong>${format(avance)} FCFA</strong>
    </div>
    <div class="payment-row">
      <span>Reste à payer</span>
      <strong>${format(totalAPayer)} FCFA</strong>
    </div>
  </div>

  <div class="bottom">
    <div>
      <strong>Lieu :</strong> ${lieu_execution}
    </div>
    <div class="sign">
      <div class="sign-line"></div>
      Cachet & Signature
    </div>
  </div>

  <div class="footer">
    Facture générée le ${dateGeneration}
  </div>

</div>
</body>
</html>
`;
};

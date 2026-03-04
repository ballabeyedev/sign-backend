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
    nomEntreprise,
    adresseEntreprise,
    telephoneEntreprise,
    emailEntreprise,
    delais_execution,
    date_execution,
    avance = 0,
    lieu_execution,
    montant,
    moyen_paiement,
    items,
    dateGeneration,
    signature
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

<style>
@page { size:A4; margin:18mm; }

body{
  font-family: Arial, Helvetica, sans-serif;
  color:#111;
  font-size:13px;
}

.title{
  text-align:center;
  font-size:38px;
  font-weight:bold;
  letter-spacing:2px;
}

.logo{
  width:130px;
  height:80px;
  border:1px solid #000;
  display:flex;
  align-items:center;
  justify-content:center;
}

.section{
  margin-top:18px;
}

hr{
  border:none;
  border-top:1px solid #000;
  margin:15px 0;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:12px;
}

th,td{
  border:1px solid #333;
  padding:8px;
}

th{
  background:#f5f5f5;
  font-weight:bold;
}

.totals{
  width:55%;
  margin-left:auto;
  margin-top:15px;
}

.totals div{
  display:flex;
  justify-content:space-between;
  padding:8px 12px;
  border:1px solid #333;
  border-top:none;
}

.totals div:first-child{
  border-top:1px solid #333;
}

.totals strong{
  font-size:14px;
}

.lieu-date{
  display:flex;
  justify-content:space-between;
  margin-top:35px;
  font-size:13px;
}

.signature-block{
  text-align:right;
  margin-top:50px;
}

.signature-img{
  max-width:160px;
  max-height:90px;
}

.footer{
  text-align:center;
  margin-top:45px;
  font-size:11px;
  border-top:1px solid #000;
  padding-top:10px;
}

.info-grid{
  display:flex;
  justify-content:space-between;
  gap:30px;
}

.info-box{
  width:48%;
}

.info-box strong{
  font-size:14px;
}

.small{
  font-size:12px;
}

</style>
</head>

<body>

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:center;">
  <div class="logo">
    ${logo ? `<img src="${logo}" style="max-width:100%;max-height:100%;" />` : 'LOGO'}
  </div>
  <div class="title">FACTURE</div>
  <div style="width:130px;"></div>
</div>

<hr>

<!-- UTILISATEUR & ENTREPRISE -->
<div class="info-grid section">

  <!-- UTILISATEUR -->
  <div class="info-box">
    <strong>ÉMIS PAR</strong><br><br>
    ${nomUtilisateur}<br>
    ${telephone || ''}<br>
    ${email || ''}
  </div>

  <!-- ENTREPRISE -->
  <div class="info-box" style="text-align:right;">
    <strong>ENTREPRISE</strong><br><br>
    ${nomEntreprise || '-'}<br>
    ${adresseEntreprise || ''}<br>
    ${telephoneEntreprise || ''}<br>
    ${emailEntreprise || ''}<br>
    RC : ${rc || '-'}<br>
    NINEA : ${ninea || '-'}
  </div>

</div>

<hr>

<!-- CLIENT & META -->
<div class="info-grid section">

  <div class="info-box">
    <strong>FACTURÉ À</strong><br><br>
    ${nomClient}<br>
    CNI : ${cniClient || '-'}
  </div>

  <div class="info-box" style="text-align:right;">
    Facture N° : <strong>${numeroFacture}</strong><br>
    Date : ${dateGeneration}<br>
    Délai : ${delais_execution}<br>
    Date exécution : ${date_execution}
  </div>

</div>

<!-- TABLE PRODUITS -->
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

<!-- TOTALS -->
<div class="totals">
  <div><span>Total HT</span><span>${format(totalHT)} FCFA</span></div>
  <div><span>TVA (${TVA_RATE * 100}%)</span><span>${format(tvaAmount)} FCFA</span></div>
  <div><strong>Total TTC</strong><strong>${format(totalTTC)} FCFA</strong></div>
</div>

<div class="totals">
  <div><span>Avance</span><span>${format(avance)} FCFA</span></div>
  <div><strong>Reste à payer</strong><strong>${format(totalAPayer)} FCFA</strong></div>
</div>

<br>

<table style="width:320px; margin-top:15px;">
<tr>
<td style="font-weight:bold;">Mode de paiement</td>
<td>${moyen_paiement}</td>
</tr>
</table>

<!-- LIEU & DATE -->
<div class="lieu-date">
  <div>
    <strong>Lieu :</strong> ${lieu_execution || '-'}
  </div>
  <div style="text-align:right">
    <strong>Date :</strong> ${today}
  </div>
</div>

<!-- SIGNATURE -->
<div class="signature-block">
  ${signature 
    ? `<img src="${signature}" class="signature-img" />` 
    : `<div style="height:80px;"></div>`
  }
  <div style="margin-top:8px;">Cachet & Signature</div>
</div>

<!-- FOOTER -->
<div class="footer">
Facture générée automatiquement • © SIGN ${new Date().getFullYear()}
</div>

</body>
</html>
`;
};
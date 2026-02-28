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

  const TVA_RATE = 0.18; // mets 0 si pas de TVA
  const totalHT = montant;
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;
  const totalAPayer = totalTTC - avance;

  const format = n => Number(n || 0).toLocaleString('fr-FR');

  return `

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { size:A4; margin:18mm; }

body{ font-family:Arial; color:#111; }

.title{
  text-align:center;
  font-size:42px;
  font-weight:bold;
}

.logo{
  width:120px;
  height:80px;
  border:1px solid #000;
  display:flex;
  align-items:center;
  justify-content:center;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th,td{
  border:1px solid #333;
  padding:8px;
}

th{ background:#eee; }

.totals{
  width:50%;
  margin-left:auto;
  margin-top:10px;
}

.totals div{
  display:flex;
  justify-content:space-between;
  padding:6px;
  border:1px solid #333;
  border-top:none;
}

.totals div:first-child{
  border-top:1px solid #333;
}

.footer{
  text-align:center;
  margin-top:30px;
  font-size:12px;
}
</style>
</head>

<body>

<div style="display:flex;justify-content:space-between;">
  <div class="logo">
    ${logo ? `<img src="${logo}" style="max-width:100%;max-height:100%"/>` : 'LOGO'}
  </div>
  <div class="title">Facture</div>
  <div></div>
</div>

<hr>

<div style="display:flex;justify-content:space-between;">
  <div>
    <strong>${nomUtilisateur}</strong><br>
    ${telephone}<br>
    ${email}
  </div>
  <div style="text-align:right">
    RC : ${rc || '-'}<br>
    NINEA : ${ninea || '-'}
  </div>
</div>

<hr>

<div style="display:flex;justify-content:space-between;">
  <div>
    <strong>CLIENT</strong><br>
    ${nomClient}<br>
    CNI : ${cniClient}
  </div>
  <div style="text-align:right">
    Facture N° : ${numeroFacture}<br>
    Date : ${dateGeneration}<br>
    Délai : ${delais_execution}<br>
    Date exécution : ${date_execution}
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
<td align="right">${format(i.quantite*i.prix_unitaire)} FCFA</td>
</tr>`).join('')}
</tbody>
</table>

<div class="totals">
  <div><span>Total HT</span><span>${format(totalHT)} FCFA</span></div>
  <div><span>TVA</span><span>${format(tvaAmount)} FCFA</span></div>
  <div><strong>Total TTC</strong><strong>${format(totalTTC)} FCFA</strong></div>
</div>

<div class="totals">
  <div><span>Avance</span><span>${format(avance)} FCFA</span></div>
  <div><strong>Reste à payer</strong><strong>${format(totalAPayer)} FCFA</strong></div>
</div>

<br>
Mode de paiement : <strong>${moyen_paiement}</strong>

<br><br>

Lieu : ${lieu_execution}

<div style="margin-top:40px;text-align:right">
  _____________________<br>
  Cachet & Signature
</div>

<div class="footer">
Facture générée par SIGN ${new Date().getFullYear()}
</div>

</body>
</html>
`;
};
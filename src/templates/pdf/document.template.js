module.exports = ({
  numeroFacture,
  typeDocument,
  nomClient,
  nomUtilisateur,
  description,
  delais_execution,
  date_execution,
  avance,
  lieu_execution,
  montant,
  moyen_paiement,
  dateGeneration,
}) => {


  const logoUrl = 'file:///' + (process.cwd() + '/uploads/logo/logo-sign.png').replace(/\\/g, '/');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${typeDocument || 'Document'}</title>
<style>
@page { size: A4; margin: 20mm 15mm; }
body { font-family: Arial, sans-serif; font-size: 14px; color: #000; }
.logo { text-align: center; margin-bottom: 20px; }
.logo img { max-width: 120px; }
.titre { border: 2px solid #000; padding: 10px; text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; }
.infos { display: flex; justify-content: space-between; margin-bottom: 30px; }
.infos-left, .infos-right { width: 48%; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
th, td { border: 1px solid #000; padding: 10px; }
th { background-color: #f2f2f2; }
.signatures { margin-top: 70px; display: flex; justify-content: space-between; }
.signature-box { width: 45%; text-align: center; }
.signature-img { max-width: 200px; max-height: 90px; margin-top: 10px; object-fit: contain; }
.footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
</style>
</head>
<body>

<div class="logo">
  <img src="${logoUrl}" />
</div>

<div class="titre">
  ${(typeDocument || 'DOCUMENT').toUpperCase()}
</div>

<div class="infos">
  <div class="infos-left">
    <p><strong>Numéro :</strong> ${numeroFacture}</p>
    <p><strong>Client :</strong> ${nomClient}</p>
    <p><strong>Professionnel :</strong> ${nomUtilisateur}</p>
    <p><strong>Description :</strong> ${description}</p>
    <p><strong>Exécution :</strong> ${delais_execution} / ${date_execution}</p>
    <p><strong>Avance :</strong> ${avance}</p>
    <p><strong>Lieu :</strong> ${lieu_execution}</p>
  </div>
  <div class="infos-right">
    <p><strong>Date :</strong><br>${dateGeneration}</p>
  </div>
</div>

<table>
<thead>
<tr>
  <th>Intitulé</th>
  <th>Montant</th>
  <th>Paiement</th>
</tr>
</thead>
<tbody>
<tr>
  <td>${description}</td>
  <td>${montant} FCFA</td>
  <td>${moyen_paiement}</td>
</tr>
</tbody>
</table>

<div class="signatures">
  <div class="signature-box">
    <strong>Signature Professionnel</strong>
    
    <p style="font-size:11px;">Signé le ${dateGeneration}</p>
  </div>

  <div class="signature-box">
    <strong>Signature Client</strong>
    
  </div>
</div>

<div class="footer">
© ${new Date().getFullYear()} – Sign
</div>

</body>
</html>
`;
};

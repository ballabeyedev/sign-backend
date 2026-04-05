module.exports = function contratBailTemplate(data) {
  const {
    numero_contrat,
    bailleur,
    locataires = [],
    bien,
    bail,
    paiement,
    depot_garantie,
    clauses,
    signature
  } = data;

  const format = n => Number(n || 0).toLocaleString('fr-FR');

  const today = new Date().toLocaleDateString('fr-FR');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 22mm 24mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', Arial, sans-serif; color: #111; font-size: 12.5px; line-height: 1.6; }
.title-word { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 900; text-transform: uppercase; text-align: center; color: #111; }
.title-underline { width: 60px; height: 2px; background: #111; margin: 8px auto 0; }
.section-tag { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #fff; background: #111; padding: 4px 12px; margin-bottom: 10px; }
hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
hr.thick { border-top: 2px solid #111; }
table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
td, th { padding: 6px; vertical-align: top; }
.meta-cell { border: 1px solid #ddd; background: #fafafa; padding: 6px 10px; }
.meta-label { font-size: 9px; font-weight: 600; color: #888; text-transform: uppercase; }
.meta-val { font-size: 12px; font-weight: 500; color: #111; text-align: right; }
.items-table { width: 100%; margin-top: 12px; border-collapse: collapse; }
.items-table th { background: #111; color: #fff; font-size: 9.5px; padding: 10px; text-align: left; }
.items-table td { border-bottom: 1px solid #e8e8e8; padding: 10px; }
.sig-line { width: 150px; height: 65px; border-bottom: 1.5px solid #333; display: block; margin-left: auto; margin-bottom: 8px; }
.sig-label { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: #888; font-weight: 600; text-align: right; }
.page-footer { text-align: center; margin-top: 32px; font-size: 10px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; }
</style>
</head>
<body>

<!-- HEADER -->
<table>
<tr>
  <td width="120">
    ${bailleur.logo ? `<img src="${bailleur.logo}" style="width:110px; height:72px; object-fit:contain; border:1.5px solid #111;">` 
      : `<table width="110" height="72" style="border:1.5px solid #111;"><tr><td align="center" valign="middle" style="font-size:10px;color:#888;">LOGO</td></tr></table>`}
  </td>
  <td valign="middle" align="center">
    <div class="title-word">Contrat de Bail</div>
    <div class="title-underline"></div>
  </td>
  <td width="120"></td>
</tr>
</table>
<hr class="thick">

<!-- BAILLEUR -->
<div class="section-tag">Bailleur</div>
<strong>${bailleur.prenom} ${bailleur.nom}</strong><br>
${bailleur.adresse || '-'}<br>
Téléphone: ${bailleur.telephone || '-'}<br>
Email: ${bailleur.email || '-'}<br>
${bailleur.nomEntreprise ? `Entreprise: ${bailleur.nomEntreprise}<br>RC: ${bailleur.rc || '-'} · NINEA: ${bailleur.ninea || '-'}` : ''}

<!-- LOCATAIRES -->
<div class="section-tag">Locataire(s)</div>
${locataires.map(l => `
<strong>${l.prenom} ${l.nom}</strong><br>
Adresse: ${l.adresse || '-'}<br>
Téléphone: ${l.telephone || '-'}<br>
Email: ${l.email || '-'}<br>
CNI: ${l.cni || '-'}<br>
`).join('<br>')}

<!-- BIEN -->
<div class="section-tag">Bien Loué</div>
Adresse: ${bien.adresse}, ${bien.ville}, ${bien.code_postal || '-'}, ${bien.pays || 'Sénégal'}<br>
Type: ${bien.type}<br>
Superficie: ${bien.superficie ? `${bien.superficie} m²` : '-'}<br>
Nombre de pièces: ${bien.nombre_pieces || '-'}<br>
Étage: ${bien.etage !== undefined ? bien.etage : '-'}<br>
Meublé: ${bien.meuble ? 'Oui' : 'Non'}<br>
Parking: ${bien.parking ? 'Oui' : 'Non'}<br>
Cave: ${bien.cave ? 'Oui' : 'Non'}<br>
Balcon/Terrasse: ${bien.balcon_terrasse ? 'Oui' : 'Non'}<br>
Usage: ${bien.usage}<br>
Description: ${bien.description || '-'}

<!-- BAIL -->
<div class="section-tag">Bail</div>
Date de début: ${bail.date_debut}<br>
Durée: ${bail.duree || '-'}<br>
Date de fin: ${bail.date_fin || 'Indéterminée'}<br>
Renouvellement automatique: ${bail.renouvelable ? 'Oui' : 'Non'}<br>
Durée du préavis: ${bail.duree_preavis || '-'}

<!-- PAIEMENT -->
<div class="section-tag">Paiement</div>
Montant du loyer: ${format(paiement.montant_loyer)} ${paiement.devise || 'FCFA'}<br>
Charges incluses: ${paiement.charges_incluses ? 'Oui' : 'Non'}<br>
Montant charges: ${format(paiement.montant_charges || 0)} ${paiement.devise || 'FCFA'}<br>
Autres charges: ${paiement.autres_charges?.length ? paiement.autres_charges.map(c => `${c.label}: ${format(c.montant)} ${paiement.devise || 'FCFA'}`).join(', ') : '-'}<br>
Jour de paiement: ${paiement.jour_paiement || 1}<br>
Périodicité: ${paiement.periodicite || 'Mensuel'}<br>
Mode: ${paiement.moyen || '-'}<br>

<!-- DEPOT DE GARANTIE -->
<div class="section-tag">Dépôt de Garantie</div>
Prévus: ${depot_garantie?.prevu ? 'Oui' : 'Non'}<br>
Montant: ${format(depot_garantie?.montant || 0)} ${paiement.devise || 'FCFA'}<br>
Date de versement: ${depot_garantie?.date_versement || '-'}<br>
Mode: ${depot_garantie?.mode_paiement || '-'}

<!-- CLAUSES -->
<div class="section-tag">Clauses</div>
Sous-location: ${clauses?.sous_location || 'Non autorisée'}<br>
Animaux: ${clauses?.animaux || 'Non autorisés'}<br>
Travaux: ${clauses?.travaux || 'Non autorisés'}<br>
Particularités: ${clauses?.personnalisees || '-'}

<!-- SIGNATURE -->
<div class="section-tag">Signature</div>
Ville: ${signature?.ville || '-'}<br>
Date: ${signature?.date || today}<br>
Bailleur: ${signature?.nom_bailleur || `${bailleur.prenom} ${bailleur.nom}`}<br>
Locataire(s): ${signature?.nom_locataire || locataires.map(l => `${l.prenom} ${l.nom}`).join(', ')}<br>
${bailleur.signature ? `<img src="${bailleur.signature}" style="max-width:150px; max-height:75px;">` : `<div class="sig-line"></div>`}
<div class="sig-label">Cachet & Signature</div>

<!-- FOOTER -->
<div class="page-footer">
Contrat généré par SIGN &nbsp;·&nbsp; ${new Date().getFullYear()}
</div>

</body>
</html>
`;
};
function templateDocument({
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
  montant,
  moyen_paiement,
  items,
  dateGeneration
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Facture - SIGN</title>

  <style>
    @page { size: A4; margin: 18mm 15mm; }

    :root{
      --black:#111;
      --gray:#f2f2f2;
      --line:#333;
    }
    *{ box-sizing:border-box; }

    body{
      margin:0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13.5px;
      color: var(--black);
      background: #e9e9e9;
      min-height: 100vh;
      display:flex;
      justify-content:center;
      align-items:center;
      padding: 20px;
    }

    /* ✅ Feuille A4 avec IMAGE de fond papier */
    .page{
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 15mm;
      background: #fff url("papier_blanc_synthetique_A4_300dpi.png") center/cover no-repeat;
      box-shadow: 0 10px 30px rgba(0,0,0,.18);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }

    /* couche blanche légère pour lisibilité */
    .page::after{
      content:"";
      position:absolute;
      inset:0;
      background: rgba(255,255,255,.25);
      pointer-events:none;
    }
    .content{ position:relative; z-index:1; }

    @media (max-width: 860px){
      .page{ width:100%; min-height:auto; }
    }

    @media print{
      body{ background:#fff; display:block; padding:0; }
      .page{ width:auto; min-height:auto; padding:0; box-shadow:none; border-radius:0; overflow:visible; }
      .page::after{ display:none; }
    }

    /* --- Style facture --- */
    .top{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap: 12mm;
    }

    .logo-box{
      width: 42mm;
      height: 32mm;
      border:1.6px solid var(--line);
      display:flex;
      align-items:center;
      justify-content:center;
      background: rgba(255,255,255,.85);
      padding: 4mm;
    }
    .logo-box img{
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display:block;
    }

    .title{
      flex: 1;
      text-align:center;
      font-size: 44px;
      font-weight: 700;
      letter-spacing: .5px;
      margin-top: 2mm;
    }

    .hr{
      border:0;
      border-top: 1.4px solid var(--line);
      margin: 8mm 0 6mm;
    }

    .company{
      display:flex;
      justify-content:space-between;
      gap: 10mm;
      margin-bottom: 6mm;
    }
    .company .left{ width:60%; }
    .company .right{ width:40%; text-align:right; line-height:1.45; }
    .company .left .name{ font-weight:700; font-size:16px; margin-bottom:2mm; }
    .company p{ margin: 1.3mm 0; line-height:1.45; }

    .meta{
      display:grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 12mm;
      position: relative;
      padding: 3mm 0;
      margin-bottom: 5mm;
    }
    .meta:before{
      content:"";
      position:absolute;
      left:50%;
      top:0;
      bottom:0;
      width:1.2px;
      background: var(--line);
      transform: translateX(-50%);
      opacity:.9;
    }
    .block-title{ font-weight:800; letter-spacing:.6px; margin:0 0 2mm; }
    .meta .right{ text-align:right; }
    .meta p{ margin: 1.4mm 0; }

    table{
      width:100%;
      border-collapse:collapse;
      margin-top: 2mm;
      background: rgba(255,255,255,.85);
    }
    th, td{
      border: 1px solid var(--line);
      padding: 8px;
      vertical-align: middle;
    }
    th{ background: var(--gray); font-weight:700; text-align:center; }
    td:nth-child(1){ text-align:left; }
    td:nth-child(2), td:nth-child(3), td:nth-child(4){ text-align:center; }

    .totals-wrap{ display:flex; justify-content:flex-end; margin-top:-1px; }
    .totals{
      width:55%;
      border-left:1px solid var(--line);
      border-right:1px solid var(--line);
      border-bottom:1px solid var(--line);
      background: rgba(255,255,255,.85);
    }
    .totals .row{ display:flex; border-top:1px solid var(--line); }
    .totals .label{ flex:1; padding:8px 10px; text-align:right; font-weight:700; }
    .totals .value{ width:35%; padding:8px 10px; text-align:right; font-weight:800; border-left:1px solid var(--line); }

    .payment{
      border:1px solid var(--line);
      margin-top: 7mm;
      background: rgba(255,255,255,.85);
    }
    .payment .row{
      display:grid;
      grid-template-columns: 1fr 1fr;
      border-bottom:1px solid var(--line);
    }
    .payment .cell{ padding:8px 10px; border-right:1px solid var(--line); }
    .payment .row .cell:last-child{ border-right:0; }
    .payment .label{ font-weight:700; }
    .payment .value{ float:right; font-weight:800; }
    .payment .row:last-child{ border-bottom:0; }
    .obs{ border-top:1px solid var(--line); padding:10px; min-height: 26mm; }

    .bottom{
      display:flex;
      justify-content:space-between;
      margin-top: 10mm;
      align-items:flex-start;
    }
    .bottom .left, .bottom .right{ width:48%; }
    .bottom .right{ text-align:right; }

    .sign{ margin-top: 18mm; text-align:right; }
    .sign .line{ display:inline-block; width:70mm; border-top:1.4px solid var(--line); margin-top:10mm; }
    .sign .txt{ margin-top:3mm; font-size:13px; color:#111; }

    .footer{ text-align:center; margin-top:14mm; font-size:12px; color:#333; }
  </style>
</head>

<body>
  <div class="page">
    <div class="content">

      <div class="top">
        <div class="logo-box">
          <img src="${logo || 'auchan.png'}" alt="Logo entreprise" onerror="this.src='auchan.png'">
        </div>
        <div class="title">Facture</div>
        <div style="width:42mm;"></div>
      </div>

      <hr class="hr"/>

      <div class="company">
        <div class="left">
          <div class="name">${nomUtilisateur}</div>
          <p>Tél : ${telephone || '-'}</p>
          <p>Email : ${email || '-'}</p>
        </div>
        <div class="right">
          <p><strong>RC :</strong> ${rc || '-'}</p>
          <p><strong>NINEA :</strong> ${ninea || '-'}</p>
        </div>
      </div>

      <hr class="hr"/>

      <div class="meta">
        <div class="left">
          <div class="block-title">CLIENT</div>
          <p>${nomClient}</p>
          <p>Numéro CNI : ${cniClient}</p>
        </div>
        <div class="right">
          <p><strong>FACTURE N° :</strong> ${numeroFacture}</p>
          <p><strong>Date :</strong> ${dateGeneration}</p>
          <p><strong>Délai d'exécution :</strong> ${delais_execution}</p>
          <p><strong>Date d'exécution :</strong> ${date_execution}</p>
        </div>
      </div>

      <table id="itemsTable">
        <thead>
          <tr>
            <th style="width:46%;">Désignation</th>
            <th style="width:12%;">Qté</th>
            <th style="width:21%;">Prix Unitaire</th>
            <th style="width:21%;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
          <tr class="item">
            <td>${item.designation || item.nom || 'Produit'}</td>
            <td>${item.quantite}</td>
            <td>${item.prix_unitaire} FCFA</td>
            <td><strong>${item.total} FCFA</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals">
          <div class="row">
            <div class="label">Total Hors Taxe (HT) :</div>
            <div class="value"><span id="totalHT">${montant}</span> FCFA</div>
          </div>
          <div class="row">
            <div class="label">TVA (18%) :</div>
            <div class="value"><span id="tvaAmount">${(parseFloat(montant) * 0.18).toLocaleString('fr-FR')}</span> FCFA</div>
          </div>
          <div class="row">
            <div class="label">Total TTC :</div>
            <div class="value"><span id="totalTTC">${(parseFloat(montant) * 1.18).toLocaleString('fr-FR')}</span> FCFA</div>
          </div>
        </div>
      </div>

      <div class="payment">
        <div class="row">
          <div class="cell">
            <span class="label">Mode de paiement :</span>
            <span class="value">${moyen_paiement}</span>
          </div>
          <div class="cell">
            <span class="label">Avance :</span>
            <span class="value">${avance}</span>
          </div>
        </div>

        <div class="row">
          <div class="cell">
            <span class="label">Lieu d'exécution :</span>
            <span class="value">${lieu_execution}</span>
          </div>
          <div class="cell">
            <span class="label">Total à payer :</span>
            <span class="value">${(parseFloat(montant) * 1.18 - parseFloat(avance || 0)).toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        <div class="obs">
          <strong>Observations :</strong>
        </div>
      </div>

      <div class="bottom">
        <div class="left">
          <p><strong>Lieu :</strong> ${lieu_execution}</p>
        </div>
        <div class="right">
          <p><strong>Date :</strong> ${dateGeneration}</p>

          <div class="sign">
            <div class="line"></div>
            <div class="txt">Cachet et signature</div>
          </div>
        </div>
      </div>

      <div class="footer">
        Facture générée par SIGN
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
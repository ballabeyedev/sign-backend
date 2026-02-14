module.exports = ({ nomClient, numeroFacture, nomProfessionnel }) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Bonjour ${nomClient},</h2>

    <p>
      Votre facture <strong>${numeroFacture}</strong> a été générée avec succès.
    </p>

    <p>
      Vous trouverez votre facture en pièce jointe.
    </p>

    <p>
      Merci pour votre confiance.
    </p>

    <br>

    <p>
      Cordialement,<br>
      <strong>${nomProfessionnel}</strong>
    </p>
  </div>
`;

module.exports = ({ nomClient, numero_facture, type, lienSignature }) => `
<p>Bonjour ${nomClient},</p>

<p>Un document <strong>${type}</strong> a été généré pour vous.</p>

<p>Pour le consulter et le signer, cliquez sur le lien ci-dessous :</p>

<p>
<a href="${lienSignature}" target="_blank">
<strong>Signer le document</strong>
</a>
</p>

<p>⚠️ Ce lien est valable pendant <strong>1 heure</strong>.</p>

<p>Merci,</p>
<p>L’équipe Sign</p>
`;

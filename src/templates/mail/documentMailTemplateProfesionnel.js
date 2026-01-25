module.exports = ({ nomProfesionnel, numero_facture, type }) => `
<p>Bonjour ${nomProfesionnel},</p>

<p>Votre document <strong>${type}</strong> a été généré avec succès.</p>

<p>Vous pouvez télécharger le PDF en pièce jointe.</p>

<p>Un email a également été envoyé au client pour qu’il signe le document.</p>

<p>Merci,</p>
<p>L’équipe Sign</p>
`;

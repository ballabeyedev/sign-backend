const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerQuittanceLoyerEmail({
  emailLocataire,
  emailBailleur,
  numero_quittance,
  mois,
  annee,
  montant_total,
  pdfBase64
}) {
  try {

    const subject = `Quittance de loyer N° ${numero_quittance}`;

    const html = `
      <h2>Quittance de loyer</h2>
      <p>Bonjour,</p>

      <p>Veuillez trouver ci-joint votre <strong>quittance de loyer</strong>.</p>

      <p><strong>Numéro :</strong> ${numero_quittance}</p>
      <p><strong>Période :</strong> ${mois} ${annee}</p>
      <p><strong>Montant total payé :</strong> ${montant_total} FCFA</p>

      <br/>

      <p>Ce document confirme la réception du paiement du loyer.</p>

      <br/>

      <p>Cordialement,<br/>L'équipe de gestion immobilière</p>
    `;

    const attachments = [
      {
        filename: `quittance_${numero_quittance}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ];

    // 📩 Envoi au locataire
    if (emailLocataire) {
      await resend.emails.send({
        from: 'Quittance Loyer <onboarding@resend.dev>',
        to: emailLocataire,
        subject,
        html,
        attachments
      });
    }

    // 📩 Envoi au bailleur
    if (emailBailleur) {
      await resend.emails.send({
        from: 'Quittance Loyer <onboarding@resend.dev>',
        to: emailBailleur,
        subject: `Copie de la quittance N° ${numero_quittance}`,
        html,
        attachments
      });
    }

    return true;

  } catch (error) {
    console.error("❌ Erreur envoi quittance:", error);
    return false;
  }
}

module.exports = envoyerQuittanceLoyerEmail;
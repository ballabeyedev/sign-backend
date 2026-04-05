const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerContratEmail({
  emailsLocataires,   // tableau d'emails
  emailBailleur,
  numero_contrat,
  pdfBase64
}) {
  try {
    const subject = `Contrat de bail N° ${numero_contrat}`;

    const html = `
      <h2>Contrat de bail</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint votre <strong>contrat de bail</strong>.</p>
      <p>Numéro du contrat : <strong>${numero_contrat}</strong></p>
      <p>Merci de bien vouloir le conserver.</p>
      <br/>
      <p>Cordialement,<br/>L'équipe de gestion immobilière</p>
    `;

    const attachments = [
      {
        filename: `contrat-${numero_contrat}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      }
    ];

    // Envoi à tous les locataires
    await Promise.all(
      emailsLocataires.map(email =>
        resend.emails.send({
          from: 'Contrat Immobilier <onboarding@resend.dev>',
          to: email,
          subject,
          html,
          attachments
        })
      )
    );

    // Copie au bailleur
    await resend.emails.send({
      from: 'Contrat Immobilier <onboarding@resend.dev>',
      to: emailBailleur,
      subject: `Copie du contrat N° ${numero_contrat}`,
      html,
      attachments
    });

    return true;
  } catch (error) {
    console.error("❌ Erreur envoi contrat:", error);
    return false;
  }
}

module.exports = envoyerContratEmail;
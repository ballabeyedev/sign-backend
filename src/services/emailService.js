const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerDocumentEmail({
  emailClient,
  emailProfessionnel,
    numero_facture,
  pdfBase64
}) {
  try {
    const subject = `Facture ${numero_facture}`;

    const html = `
      <h2>Votre facture est disponible</h2>
      <p>Veuillez trouver votre facture en pièce jointe.</p>
      <p>Numéro : <strong>${numero_facture}</strong></p>
    `;

    const attachments = [
      {
        filename: `facture-${numero_facture}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      }
    ];

    // 📩 envoyer au client
    await resend.emails.send({
      from: 'Facturation <onboarding@resend.dev>',
      to: emailClient,
      subject,
      html,
      attachments
    });

    // 📩 envoyer au professionnel
    await resend.emails.send({
      from: 'Facturation <onboarding@resend.dev>',
      to: emailProfessionnel,
      subject: `Copie envoyée au client — ${numero_facture}`,
      html,
      attachments
    });

    return true;

  } catch (error) {
    console.error("Erreur envoi email:", error);
    return false;
  }
}

module.exports = envoyerDocumentEmail;
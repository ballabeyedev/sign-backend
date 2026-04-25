const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerFichePaieEmail({
  emailSalarie,
  emailEmployeur,
  numero_fiche,
  mois,
  annee,
  salaire_net,
  pdfBase64
}) {
  try {

    const subject = `Fiche de paie N° ${numero_fiche}`;

    const html = `
      <h2>Fiche de paie</h2>
      <p>Bonjour,</p>

      <p>Veuillez trouver ci-joint votre <strong>fiche de paie</strong>.</p>

      <p><strong>Numéro :</strong> ${numero_fiche}</p>
      <p><strong>Période :</strong> ${mois} ${annee}</p>
      <p><strong>Salaire net :</strong> ${salaire_net} FCFA</p>

      <br/>

      <p>Ce document résume votre rémunération pour la période indiquée.</p>

      <br/>

      <p>Cordialement,<br/>Service Ressources Humaines</p>
    `;

    const attachments = [
      {
        filename: `fiche_paie_${numero_fiche}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ];

    // 📩 Envoi au salarié
    if (emailSalarie) {
      await resend.emails.send({
        from: 'Fiche de Paie <onboarding@resend.dev>',
        to: emailSalarie,
        subject,
        html,
        attachments
      });
    }

    // 📩 Envoi à l’employeur
    if (emailEmployeur) {
      await resend.emails.send({
        from: 'Fiche de Paie <onboarding@resend.dev>',
        to: emailEmployeur,
        subject: `Copie de la fiche N° ${numero_fiche}`,
        html,
        attachments
      });
    }

    return true;

  } catch (error) {
    console.error("❌ Erreur envoi fiche de paie:", error);
    return false;
  }
}

module.exports = envoyerFichePaieEmail;
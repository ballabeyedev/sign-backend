const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerFichePaieEmail({
  emailEmployeur,
  numero_fiche,
  nom,
  mois,
  annee,
  salaire_net,
  pdfBase64
}) {
  try {

    const subject = `Fiche de paie N° ${numero_fiche} — ${mois} ${annee}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

        <h2 style="color: #2c3e50;">Fiche de paie</h2>

        <p>Bonjour,</p>

        <p>Veuillez trouver ci-joint la <strong>fiche de paie</strong> générée via la plateforme SIGN.</p>

        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Numéro</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${numero_fiche}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Salarié</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${nom}</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Période</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${mois} ${annee}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Salaire net</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #27ae60;"><strong>${Number(salaire_net).toLocaleString('fr-FR')} FCFA</strong></td>
          </tr>
        </table>

        <p>Le PDF est joint à cet email.</p>

        <br/>

        <p style="color: #7f8c8d; font-size: 12px;">
          Cet email a été généré automatiquement par la plateforme SIGN.<br/>
          Merci de ne pas y répondre directement.
        </p>

      </div>
    `;

    const attachments = pdfBase64 ? [
      {
        filename: `fiche_paie_${numero_fiche}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ] : [];

    // 📩 Envoi à l'employeur (copie)
    if (emailEmployeur) {
      await resend.emails.send({
        from: 'Fiche de Paie SIGN <onboarding@resend.dev>',
        to: emailEmployeur,
        subject,
        html,
        attachments
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur envoi email fiche de paie:', error);
    return false;
  }
}

module.exports = envoyerFichePaieEmail;
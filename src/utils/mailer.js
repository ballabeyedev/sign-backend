// mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs'); // pour lire les fichiers PDF si besoin

// Configurer le client Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // ta clé API V3

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Envoi d'un email via l'API Brevo
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML
 * @param {Array} attachments - Pièces jointes [{ filename, content }]
 */
exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    // Transformer les attachments en base64 si ce n'est pas déjà le cas
    const formattedAttachments = attachments.map(att => ({
      name: att.filename,
      content: att.content.toString('base64') // Brevo attend base64
    }));

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: to }],
      sender: { name: "Support", email: process.env.MAIL_FROM },
      subject: subject,
      htmlContent: html,
      attachment: formattedAttachments
    });

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email envoyé avec succès via Brevo API', data);
  } catch (error) {
    console.error('❌ Erreur envoi email via Brevo API:', error);
    throw error;
  }
};

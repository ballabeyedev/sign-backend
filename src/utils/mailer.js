// mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    // 🔍 LOG 1 : Vérifier la variable MAIL_FROM
    console.log('🔍 MAIL_FROM =', process.env.MAIL_FROM);

    // Transformer les pièces jointes
    const formattedAttachments = attachments.map(att => ({
      name: att.filename,
      content: att.content.toString('base64')
    }));

    // Construire l'objet email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: to }],
      sender: { 
        name: "Support", 
        email: process.env.MAIL_FROM || "beyeballa04@gmail.com" 
      },

      subject: subject,
      htmlContent: html,
      attachment: formattedAttachments
    });

    // 🔍 LOG 2 : Afficher l'objet complet (attention : peut contenir des données volumineuses)
    console.log('🔍 Objet sendSmtpEmail (sans les pièces jointes) :', {
      ...sendSmtpEmail,
      attachment: sendSmtpEmail.attachment ? `[${sendSmtpEmail.attachment.length} pièce(s) jointe(s)]` : 'aucune'
    });

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email envoyé avec succès via Brevo API', data);
  } catch (error) {
    console.error('❌ Erreur envoi email via Brevo API:');
    // 🔍 LOG 3 : Afficher plus de détails sur l'erreur
    if (error.response && error.response.body) {
      console.error('Détails de l’erreur API :', error.response.body);
    } else {
      console.error(error);
    }
    throw error;
  }
};
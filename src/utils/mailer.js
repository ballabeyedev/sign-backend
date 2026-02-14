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

    // Vérifier si la clé API est présente
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY non définie !');
    }

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

    // 🔍 LOG 2 : Afficher l'objet complet
    console.log('🔍 Objet sendSmtpEmail :');
    console.log(JSON.stringify(sendSmtpEmail, null, 2));

    // 🔍 LOG 3 : Vérifier le type et la valeur du sender
    console.log('🔍 Vérification sender :', sendSmtpEmail.sender);
    console.log('🔍 Type de sender:', typeof sendSmtpEmail.sender);
    console.log('🔍 sender.email est défini ?', !!sendSmtpEmail.sender.email);
    console.log('🔍 sender.name est défini ?', !!sendSmtpEmail.sender.name);

    // 🔍 LOG 4 : Vérifier le destinataire
    console.log('🔍 Destinataire :', sendSmtpEmail.to);

    // Envoyer l'email
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email envoyé avec succès via Brevo API', data);
    
  } catch (error) {
    console.error('❌ Erreur envoi email via Brevo API:');

    // 🔍 LOG 5 : Tout le contenu de l'erreur
    console.error('🔍 error object :', error);

    if (error.response) {
      console.error('🔍 error.response.status :', error.response.status);
      console.error('🔍 error.response.body :', error.response.body);
      console.error('🔍 error.response.text :', error.response.text);
    }

    throw error;
  }
};

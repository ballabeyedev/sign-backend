const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT) || 2525,
  secure: false, // IMPORTANT → false pour 587 ou 2525
  auth: {
    user: process.env.BREVO_SMTP_USER, // doit être "apikey"
    pass: process.env.BREVO_SMTP_PASS  // clé SMTP Brevo
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
   logger: true,      // ← active les logs
  debug: true, 
});

/**
 * Envoi email avec pièce jointe possible
 */
exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log("✅ Email envoyé avec succès");
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw error;
  }
};

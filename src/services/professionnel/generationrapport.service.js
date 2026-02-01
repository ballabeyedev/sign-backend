const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const fs = require('fs');
const path = require('path');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');
const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const htmlToText = require('html-to-text'); // pour convertir HTML en texte simple si nécessaire

class GestionDocumentService {

  // GÉNÉRER NUMÉRO FACTURE
  static async genererNumeroFacture() {
    const annee = new Date().getFullYear();

    const dernierDocument = await Document.findOne({
      where: { numero_facture: { [Op.like]: `FAC-${annee}-%` } },
      order: [['createdAt', 'DESC']]
    });

    let compteur = 1;
    if (dernierDocument) {
      compteur = parseInt(dernierDocument.numero_facture.split('-')[2]) + 1;
    }

    return `FAC-${annee}-${String(compteur).padStart(4, '0')}`;
  }

  // CRÉER DOCUMENT
  static async creerDocument({
    clientId,
    delais_execution,
    date_execution,
    avance,
    lieu_execution,
    moyen_paiement = 'ESPECES',
    items,
    utilisateurConnecte
  }) {

    const transaction = await sequelize.transaction();

    try {
      // 1️⃣ Vérifier client
      const client = await Utilisateur.findByPk(clientId);
      if (!client) return { error: 'Client non trouvé' };

      // 2️⃣ Vérifier items
      if (!items || !Array.isArray(items) || items.length === 0) return { error: 'Aucun produit fourni' };

      // 3️⃣ Calcul montant total
      const montant = items.reduce((total, item) => total + (item.quantite * item.prix_unitaire), 0);
      if (montant <= 0) return { error: 'Montant invalide' };

      // 4️⃣ Numéro facture
      const numero_facture = await this.genererNumeroFacture();

      // Données pour le template PDF
      const donneesTemplate = {
        numeroFacture: numero_facture,
        nomClient: `${client.nom} ${client.prenom}`,
        nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
        delais_execution: delais_execution || '-',
        date_execution: date_execution || '-',
        avance: avance ? `${avance} FCFA` : '-',
        lieu_execution: lieu_execution || '-',
        montant,
        moyen_paiement,
        items,
        dateGeneration: new Date().toLocaleDateString('fr-FR')
      };

      // Génération du contenu HTML
      const html = templateDocument(donneesTemplate);

      // Dossier PDF
      const dossierDocuments = path.join(__dirname, '../../uploads/documents');
      if (!fs.existsSync(dossierDocuments)) fs.mkdirSync(dossierDocuments, { recursive: true });

      const fichierNom = `${numero_facture}.pdf`;
      const fichierPath = path.join(dossierDocuments, fichierNom);

      // 🔹 Génération PDF avec pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;

      // Convertir HTML en texte simple (simple et rapide)
      const textContent = htmlToText.convert(html, { wordwrap: 100 });

      // Ajouter le texte au PDF
      page.drawText(textContent, {
        x: 50,
        y: height - 50,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        lineHeight: 15,
      });

      // Sauvegarde du PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(fichierPath, pdfBytes);

      // 5️⃣ Création Document en DB
      const document = await Document.create({
        numero_facture,
        clientId,
        delais_execution,
        date_execution,
        avance: avance || 0,
        lieu_execution,
        montant,
        moyen_paiement
      }, { transaction });

      // 6️⃣ Création des produits
      const documentItems = items.map(item => ({
        designation: item.designation,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        documentId: document.id
      }));

      await DocumentItem.bulkCreate(documentItems, { transaction });

      // 7️⃣ Commit DB
      await transaction.commit();

      // 8️⃣ Envoi des emails
      await sendEmail({
        to: client.email,
        subject: `Voici votre facture – ${numero_facture}`,
        html: documentMailTemplateClient({ nomClient: `${client.nom} ${client.prenom}`, numero_facture }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      await sendEmail({
        to: utilisateurConnecte.email,
        subject: `Copie du document ${numero_facture}`,
        html: documentMailTemplateProfesionnel({ nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`, numero_facture }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      return { document };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);
      throw error;
    }
  }
}

module.exports = GestionDocumentService;

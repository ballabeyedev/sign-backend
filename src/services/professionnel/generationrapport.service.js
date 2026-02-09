const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');
const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');
const { PDFDocument, rgb } = require('pdf-lib');

class GestionDocumentService {

  // 🔹 GÉNÉRER NUMÉRO FACTURE
  static async genererNumeroFacture() {
    try {
      const annee = new Date().getFullYear();

      const dernierDocument = await Document.findOne({
        where: { numero_facture: { [Op.like]: `FAC-${annee}-%` } },
        order: [['createdAt', 'DESC']],
        attributes: ['numero_facture']
      });

      let compteur = 1;
      if (dernierDocument && dernierDocument.numero_facture) {
        const parts = dernierDocument.numero_facture.split('-');
        if (parts.length === 3) {
          compteur = parseInt(parts[2]) + 1;
          if (isNaN(compteur)) compteur = 1;
        }
      }

      return `FAC-${annee}-${String(compteur).padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Erreur genererNumeroFacture:', error);
      throw new Error('Erreur lors de la génération du numéro de facture');
    }
  }

  // 🔹 CRÉER DOCUMENT
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
      const client = await Utilisateur.findByPk(clientId);
      if (!client) {
        await transaction.rollback();
        return { success: false, error: 'Client non trouvé' };
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { success: false, error: 'Aucun produit fourni' };
      }

      const montant = items.reduce((total, item) => {
        const qte = Number(item.quantite) || 0;
        const prix = Number(item.prix_unitaire) || 0;
        return total + (qte * prix);
      }, 0);

      if (montant <= 0) {
        await transaction.rollback();
        return { success: false, error: 'Montant invalide' };
      }

      const numero_facture = await this.genererNumeroFacture();

      // Création document
      const document = await Document.create({
        numero_facture,
        clientId,
        professionnelId: utilisateurConnecte.id,
        delais_execution: delais_execution || null,
        date_execution: date_execution || null,
        avance: Number(avance) || 0,
        lieu_execution: lieu_execution || null,
        montant,
        moyen_paiement,
        status: 'EN_COURS'
      }, { transaction });

      const documentItems = items.map(item => ({
        designation: item.designation,
        quantite: Number(item.quantite) || 0,
        prix_unitaire: Number(item.prix_unitaire) || 0,
        documentId: document.id
      }));

      await DocumentItem.bulkCreate(documentItems, { transaction, validate: true });
      await transaction.commit();

      // 🔹 Générer le PDF (hors transaction)
      const donneesTemplate = {
        numeroFacture: numero_facture,
        nomClient: `${client.nom} ${client.prenom}`,
        nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
        delais_execution: delais_execution || '-',
        date_execution: date_execution ? new Date(date_execution).toLocaleDateString('fr-FR') : '-',
        avance: avance ? `${Number(avance).toLocaleString('fr-FR')} FCFA` : '-',
        lieu_execution: lieu_execution || '-',
        montant: montant.toLocaleString('fr-FR'),
        moyen_paiement,
        items: items.map(item => ({
          ...item,
          prix_unitaire: Number(item.prix_unitaire).toLocaleString('fr-FR'),
          total: (Number(item.quantite) * Number(item.prix_unitaire)).toLocaleString('fr-FR')
        })),
        dateGeneration: new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };

      const html = templateDocument(donneesTemplate);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // Format A4

      const fontBytes = await fs.readFile(path.join(__dirname, '../../fonts/Roboto-Regular.ttf'));
      const font = await pdfDoc.embedFont(fontBytes);

      const lines = html
        .replace(/<[^>]*>/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      let y = 800;
      const lineHeight = 15;

      for (const line of lines) {
        if (y < 50) {
          pdfDoc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }

      const pdfBytes = await pdfDoc.save();

      // 🔹 Conversion en Base64
      const pdfBase64 = pdfBytes.toString('base64');

      // 🔹 Enregistrement dans la base
      await Document.update(
        { document_pdf: pdfBase64 },
        { where: { id: document.id } }
      );

      // 🔹 Crée aussi un fichier physique (optionnel pour les emails)
      const dossierDocuments = path.join(__dirname, '../../uploads/documents');
      await fs.mkdir(dossierDocuments, { recursive: true });
      const fichierNom = `${numero_facture}.pdf`;
      const fichierPath = path.join(dossierDocuments, fichierNom);
      await fs.writeFile(fichierPath, pdfBytes);

      // 🔹 Envoi des emails
      this.envoyerEmailsEnBackground({
        client,
        utilisateurConnecte,
        numero_facture,
        fichierPath,
        fichierNom
      });

      return { success: true, document, message: 'Document créé et PDF stocké en base de données' };

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);
      return { success: false, message: 'Erreur lors de la création du document', error: error.message };
    }
  }

  // 🔹 ENVOI EMAILS
  static async envoyerEmailsEnBackground({ client, utilisateurConnecte, numero_facture, fichierPath, fichierNom }) {
    try {
      await fs.access(fichierPath);

      // Client
      await sendEmail({
        to: client.email,
        subject: `Votre facture – ${numero_facture}`,
        html: documentMailTemplateClient({
          nomClient: `${client.nom} ${client.prenom}`,
          numero_facture
        }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      // Professionnel
      await sendEmail({
        to: utilisateurConnecte.email,
        subject: `Copie du document ${numero_facture}`,
        html: documentMailTemplateProfesionnel({
          nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          numero_facture
        }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      console.log(`✅ Emails envoyés avec succès pour ${numero_facture}`);
    } catch (err) {
      console.error('❌ Erreur lors de l’envoi des emails :', err);
    }
  }
}

module.exports = GestionDocumentService;

const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const fs = require('fs').promises; // opérations asynchrones
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
        where: { 
          numero_facture: { [Op.like]: `FAC-${annee}-%` } 
        },
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
      // 1️⃣ Vérifier client
      const client = await Promise.race([
        Utilisateur.findByPk(clientId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout client')), 5000))
      ]);

      if (!client) {
        await transaction.rollback();
        return { success: false, error: 'Client non trouvé' };
      }

      // 2️⃣ Vérifier items
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { success: false, error: 'Aucun produit fourni' };
      }

      // 3️⃣ Calcul montant total
      const montant = items.reduce((total, item) => {
        const qte = Number(item.quantite) || 0;
        const prix = Number(item.prix_unitaire) || 0;
        return total + (qte * prix);
      }, 0);

      if (montant <= 0) {
        await transaction.rollback();
        return { success: false, error: 'Montant invalide' };
      }

      // 4️⃣ Numéro facture
      const numero_facture = await this.genererNumeroFacture();

      // 5️⃣ Création Document en DB
      const document = await Document.create({
        numero_facture,
        clientId,
        delais_execution: delais_execution || null,
        date_execution: date_execution || null,
        avance: Number(avance) || 0,
        lieu_execution: lieu_execution || null,
        montant,
        moyen_paiement,
        status: 'EN_COURS'
      }, { transaction });

      // 6️⃣ Création des produits
      const documentItems = items.map(item => ({
        designation: item.designation,
        quantite: Number(item.quantite) || 0,
        prix_unitaire: Number(item.prix_unitaire) || 0,
        documentId: document.id
      }));

      await DocumentItem.bulkCreate(documentItems, { transaction, validate: true });

      // 7️⃣ Commit DB
      await transaction.commit();

      // 8️⃣ Génération PDF UTF-8 (hors transaction)
      try {
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

        const dossierDocuments = path.join(__dirname, '../../uploads/documents');
        await fs.mkdir(dossierDocuments, { recursive: true });

        const fichierNom = `${numero_facture}.pdf`;
        const fichierPath = path.join(dossierDocuments, fichierNom);

        // 🔹 PDF-lib avec UTF-8
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4

        // Charger une font TTF UTF-8 (ex: Roboto)
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
            page.addPage([595, 842]);
            y = 800;
          }

          page.drawText(line, {
            x: 50,
            y,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });

          y -= lineHeight;
        }

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(fichierPath, pdfBytes);

        // 9️⃣ Envoi emails
        this.envoyerEmailsEnBackground({
          client,
          utilisateurConnecte,
          numero_facture,
          fichierPath,
          fichierNom
        });

        return { success: true, document, message: 'Document créé avec succès' };

      } catch (pdfError) {
        console.error('❌ Erreur génération PDF:', pdfError);
        await Document.update({ status: 'ERREUR_PDF' }, { where: { id: document.id } });
        return { success: true, document, warning: 'Document créé mais PDF non généré' };
      }

    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);

      if (error.message.includes('Timeout')) {
        return { success: false, message: 'Timeout: La requête a pris trop de temps', error: error.message };
      }

      if (error.name === 'SequelizeValidationError') {
        return { success: false, message: 'Erreur de validation des données', errors: error.errors.map(e => e.message) };
      }

      return { success: false, message: 'Erreur serveur lors de la création du document', error: error.message };
    }
  }

  // 🔹 Envoi emails en arrière-plan
  static async envoyerEmailsEnBackground({ client, utilisateurConnecte, numero_facture, fichierPath, fichierNom }) {
    try {
      await fs.access(fichierPath);

      // Client
      await sendEmail({
        to: client.email,
        subject: `Voici votre facture – ${numero_facture}`,
        html: documentMailTemplateClient({ nomClient: `${client.nom} ${client.prenom}`, numero_facture }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      // Professionnel
      await sendEmail({
        to: utilisateurConnecte.email,
        subject: `Copie du document ${numero_facture}`,
        html: documentMailTemplateProfesionnel({ nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`, numero_facture }),
        attachments: [{ filename: fichierNom, path: fichierPath }]
      });

      console.log(`✅ Emails envoyés pour ${numero_facture}`);
    } catch (err) {
      console.error('❌ Erreur envoi email:', err);
    }
  }
}

module.exports = GestionDocumentService;

const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const fs = require('fs');
const path = require('path');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');
const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');
const puppeteer = require('puppeteer');


class GestionDocumentService {

  // GÉNÉRER NUMÉRO FACTURE
  static async genererNumeroFacture() {
    const annee = new Date().getFullYear();

    const dernierDocument = await Document.findOne({
      where: {
        numero_facture: {
          [Op.like]: `FAC-${annee}-%`
        }
      },
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
      if (!client) {
        await transaction.rollback();
        return { error: 'Client non trouvé' };
      }

      // 2️⃣ Vérifier items
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { error: 'Aucun produit fourni' };
      }

      // 3️⃣ Calcul montant total
      const montant = items.reduce(
        (total, item) => total + (item.quantite * item.prix_unitaire),
        0
      );

      if (montant <= 0) {
        await transaction.rollback();
        return { error: 'Montant invalide' };
      }

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

      // Génération HTML
      const html = templateDocument(donneesTemplate);

      // Dossier PDF
      const dossierDocuments = path.join(__dirname, '../../uploads/documents');
      if (!fs.existsSync(dossierDocuments)) {
        fs.mkdirSync(dossierDocuments, { recursive: true });
      }

      const fichierNom = `${numero_facture}.pdf`;
      const fichierPath = path.join(dossierDocuments, fichierNom);

      // Génération PDF
      const browser = await puppeteer.launch({
        headless: 'true',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const pageDoc = await browser.newPage();
      await pageDoc.setContent(html, { waitUntil: 'networkidle0' });
      await pageDoc.pdf({
        path: fichierPath,
        format: 'A4',
        printBackground: true
      });

      await browser.close();

      // 5️⃣ Création Document
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

      // Email client
      await sendEmail({
        to: client.email,
        subject: `Voici votre facture – ${numero_facture}`,
        html: documentMailTemplateClient({
          nomClient: `${client.nom} ${client.prenom}`,
          numero_facture
        }),
        attachments: [
          { filename: fichierNom, path: fichierPath }
        ]
      });

      // Email professionnel
      await sendEmail({
        to: utilisateurConnecte.email,
        subject: `Copie du document ${numero_facture}`,
        html: documentMailTemplateProfesionnel({
          nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          numero_facture
        }),
        attachments: [
          { filename: fichierNom, path: fichierPath }
        ]
      });

      return { document };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);
      throw error;
    }
  }
}

module.exports = GestionDocumentService;

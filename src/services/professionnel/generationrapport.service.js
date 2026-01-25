const { Document, Utilisateur, TypeFacture } = require('../../models');
const fs = require('fs');
const path = require('path');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');
const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

class GestionDocumentService {

  //GÉNÉRER NUMÉRO FACTURE
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

  //CRÉER DOCUMENT
  static async creerDocument({
    clientId,
    typeFactureId,
    description,
    delais_execution,
    date_execution,
    avance,
    lieu_execution,
    montant,
    moyen_paiement = 'CASH',
    utilisateurConnecte
  }){
    try {
      //Vérification client
      const client = await Utilisateur.findOne({
        where: { id: clientId, role: 'Client' }
      });

      if (!client) {
        return { error: 'Client non trouvé' };
      }

      const typeFacture = await TypeFacture.findOne({
        where: { id: typeFactureId, actif: true }
      });

      if (!typeFacture) {
        return { error: 'Type de facture invalide ou inactif' };
      }

      //Numéro facture
      const numero_facture = await this.genererNumeroFacture();

      // Validation montant et avance
      if (montant < 0) return { error: "Le montant doit être >= 0" };
      if (avance && avance < 0) return { error: "L'avance doit être >= 0" };

      //Données pour le template PDF
      const donneesTemplate = {
        numeroFacture: numero_facture,
        typeDocument: typeFacture.libelle,
        nomClient: `${client.nom} ${client.prenom}`,
        nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
        description: description || '',
        delais_execution: delais_execution || '-',
        date_execution: date_execution || '-',
        avance: avance ? `${avance} FCFA` : '-',
        lieu_execution: lieu_execution || '-',
        montant: montant || 0,
        moyen_paiement: moyen_paiement || '',
        dateGeneration: new Date().toLocaleDateString('fr-FR')
      };


      //Génération HTML
      const html = templateDocument(donneesTemplate);

      //Dossier PDF
      const dossierDocuments = path.join(__dirname, '../../uploads/documents');
      if (!fs.existsSync(dossierDocuments)) {
        fs.mkdirSync(dossierDocuments, { recursive: true });
      }

      const fichierNom = `${numero_facture}.pdf`;
      const fichierPath = path.join(dossierDocuments, fichierNom);

      // 🖨️ Génération PDF avec Puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: fichierPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await browser.close();

      //Sauvegarde DB
      const document = await Document.create({
        numero_facture,
        clientId,
        typeFactureId,
        description,
        delais_execution,
        date_execution,
        avance,
        lieu_execution,
        montant,
        moyen_paiement,
        status: 'EN_ATTENTE_SIGNATURE_CLIENT'
      });

      //Email client
      await sendEmail({
        to: client.email,
        subject: `Signature requise – Document ${numero_facture}`,
        html: documentMailTemplateClient({
          nomClient: `${client.nom} ${client.prenom}`,
          numero_facture,
          type: typeFacture.libelle,
        })
      });

      // 📧 Email professionnel
      await sendEmail({
        to: utilisateurConnecte.email,
        subject: `Copie du document ${numero_facture}`,
        html: documentMailTemplateProfesionnel({
          nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          numero_facture,
          type: typeFacture.libelle,
        }),
        attachments: [
          {
            filename: fichierNom,
            path: fichierPath,
            contentType: 'application/pdf'
          }
        ]
      });

      return { document };

    } catch (error) {
      console.error('❌ Erreur creerDocument:', error);
      throw error;
    }
  }
}

module.exports = GestionDocumentService;

const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');

// ✅ CORRECTION : nom cohérent
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');
const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');

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
      if (dernierDocument?.numero_facture) {
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
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout client')), 5000)
        )
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

      // 5️⃣ Création Document
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
        status: 'EN_COURS',
        document_pdf: null
      }, { transaction });

      // 6️⃣ Produits
      const documentItems = items.map(item => ({
        designation: item.designation,
        quantite: Number(item.quantite) || 0,
        prix_unitaire: Number(item.prix_unitaire) || 0,
        documentId: document.id
      }));

      await DocumentItem.bulkCreate(documentItems, {
        transaction,
        validate: true
      });

      // 7️⃣ Commit DB
      await transaction.commit();

      // 8️⃣ Génération PDF
      try {
        const donneesTemplate = {
          numeroFacture: numero_facture,
          nomClient: `${client.nom} ${client.prenom}`,
          nomUtilisateur: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
          delais_execution: delais_execution || '-',
          date_execution: date_execution
            ? new Date(date_execution).toLocaleDateString('fr-FR')
            : '-',
          avance: avance
            ? `${Number(avance).toLocaleString('fr-FR')} FCFA`
            : '-',
          lieu_execution: lieu_execution || '-',
          montant: montant.toLocaleString('fr-FR'),
          moyen_paiement,
          items: items.map(item => ({
            ...item,
            prix_unitaire: Number(item.prix_unitaire).toLocaleString('fr-FR'),
            total: (
              Number(item.quantite) * Number(item.prix_unitaire)
            ).toLocaleString('fr-FR')
          })),
          dateGeneration: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };

        const html = templateDocument(donneesTemplate);

        const pdfBuffer = await generatePDFBuffer(html);
        const pdfBase64 = pdfBuffer.toString('base64');

        await Document.update(
          { document_pdf: pdfBase64 },
          { where: { id: document.id } }
        );

        const pdfAttachment = {
          filename: `facture-${numero_facture}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        };

        // 📧 Client
        await sendEmail({
          to: client.email,
          subject: `Votre facture – ${numero_facture}`,
          html: documentMailTemplateClient({
            nomClient: `${client.nom} ${client.prenom}`,
            numero_facture,
            type: 'Facture'
          }),
          attachments: [pdfAttachment]
        });

        // 📧 Professionnel
        await sendEmail({
          to: utilisateurConnecte.email,
          subject: `Copie de votre facture – ${numero_facture}`,
          html: documentMailTemplateProfesionnel({
            nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
            numero_facture,
            type: 'Facture'
          }),
          attachments: [pdfAttachment]
        });

        return {
          success: true,
          document: {
            ...document.toJSON(),
            document_pdf: pdfBase64
          },
          message: 'Document créé avec succès et PDF généré'
        };

      } catch (pdfError) {
        console.error('❌ Erreur génération PDF:', pdfError);
        await Document.update(
          { status: 'ERREUR_PDF' },
          { where: { id: document.id } }
        );
        return {
          success: true,
          document,
          warning: 'Document créé mais PDF non généré'
        };
      }

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }

      console.error('❌ Erreur creerDocument:', error);

      if (error.message.includes('Timeout')) {
        return {
          success: false,
          message: 'Timeout: La requête a pris trop de temps',
          error: error.message
        };
      }

      if (error.name === 'SequelizeValidationError') {
        return {
          success: false,
          message: 'Erreur de validation des données',
          errors: error.errors.map(e => e.message)
        };
      }

      return {
        success: false,
        message: 'Erreur serveur lors de la création du document',
        error: error.message
      };
    }
  }
}

// 🔧 Génération PDF (inchangée)
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, {
      format: 'A4',
      border: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}

module.exports = GestionDocumentService;

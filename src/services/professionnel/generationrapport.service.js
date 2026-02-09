const { Document, DocumentItem, Utilisateur } = require('../../models');
const sequelize = require('../../config/db');
const templateDocument = require('../../templates/pdf/document.template');
const { Op } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');

const documentMailTemplateProfesionnel = require('../../templates/mail/documentMailTemplateProfesionnel');
const documentMailTemplateClient = require('../../templates/mail/documentMailTemplateClient');

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
        compteur = parseInt(parts[2], 10) + 1 || 1;
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
      // 1️⃣ Client
      const client = await Utilisateur.findByPk(clientId);
      if (!client) {
        await transaction.rollback();
        return { success: false, error: 'Client non trouvé' };
      }

      // 2️⃣ Items
      if (!Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return { success: false, error: 'Aucun produit fourni' };
      }

      // 3️⃣ Montant
      const montant = items.reduce((total, item) => {
        return total +
          (Number(item.quantite) || 0) *
          (Number(item.prix_unitaire) || 0);
      }, 0);

      if (montant <= 0) {
        await transaction.rollback();
        return { success: false, error: 'Montant invalide' };
      }

      // 4️⃣ Numéro facture
      const numero_facture = await this.genererNumeroFacture();

      // 5️⃣ Document
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

      // 6️⃣ Items DB
      await DocumentItem.bulkCreate(
        items.map(item => ({
          designation: item.designation,
          quantite: Number(item.quantite) || 0,
          prix_unitaire: Number(item.prix_unitaire) || 0,
          documentId: document.id
        })),
        { transaction }
      );

      await transaction.commit();

      // 7️⃣ PDF
      const html = templateDocument({
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
        items: items.map(i => ({
          ...i,
          prix_unitaire: Number(i.prix_unitaire).toLocaleString('fr-FR'),
          total: (
            Number(i.quantite) * Number(i.prix_unitaire)
          ).toLocaleString('fr-FR')
        })),
        dateGeneration: new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      const pdfBuffer = await generatePDFBuffer(html);
      const pdfBase64 = pdfBuffer.toString('base64');

      await Document.update(
        { document_pdf: pdfBase64 },
        { where: { id: document.id } }
      );

      // 8️⃣ EMAILS (NON BLOQUANTS 🔥)
      this.envoyerEmails({
        client,
        utilisateurConnecte,
        numero_facture,
        pdfBuffer
      }).catch(err => {
        console.error('❌ Erreur envoi email:', err.message);
      });

      return {
        success: true,
        message: 'Document créé avec succès',
        data: {
          documentId: document.id,
          numero_facture
        }
      };

    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('❌ Erreur creerDocument:', error);
      return { success: false, message: error.message };
    }
  }

  // 📧 ENVOI EMAIL (ASYNCHRONE)
  static async envoyerEmails({
    client,
    utilisateurConnecte,
    numero_facture,
    pdfBuffer
  }) {
    const attachment = {
      filename: `facture-${numero_facture}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    };

    await sendEmail({
      to: client.email,
      subject: `Votre facture – ${numero_facture}`,
      html: documentMailTemplateClient({
        nomClient: `${client.nom} ${client.prenom}`,
        numero_facture,
        type: 'Facture'
      }),
      attachments: [attachment]
    });

    await sendEmail({
      to: utilisateurConnecte.email,
      subject: `Copie de votre facture – ${numero_facture}`,
      html: documentMailTemplateProfesionnel({
        nomProfesionnel: `${utilisateurConnecte.nom} ${utilisateurConnecte.prenom}`,
        numero_facture,
        type: 'Facture'
      }),
      attachments: [attachment]
    });
  }

  static async getMesDocuments({ utilisateurConnecte }) {
    try {
      const documents = await Document.findAll({
        where: {
          professionnelId: utilisateurConnecte.id
        },
        include: [
          {
            model: Utilisateur,
            as: 'client',
            attributes: ['id', 'nom', 'prenom', 'email']
          },
          {
            model: DocumentItem,
            as: 'items'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: documents
      };

    } catch (error) {
      console.error('❌ Erreur getMesDocuments:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des documents'
      };
    }
  }

}

// 🔧 PDF
async function generatePDFBuffer(html) {
  const pdf = require('html-pdf');

  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}


module.exports = GestionDocumentService;

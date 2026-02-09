const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth.middleware');
const gestionDocumentController = require('../../controllers/professionnel/generationrapport.controller');

router.post('/creer-document', auth, gestionDocumentController.creerDocument);
router.get('/mes-documents', auth, gestionDocumentController.getMesDocuments);
router.get(
  '/telecharger-document/:documentId',
  auth,
  gestionDocumentController.telechargerDocument
);
module.exports = router;

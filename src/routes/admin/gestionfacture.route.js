const express = require('express');
const router = express.Router();
const gestionFactureController = require('../../controllers/admin/gestionfacture.controller');
const auth = require('../../middlewares/auth.middleware');

// -------------------- NOMBRE DE FACTURES --------------------
router.get(
  '/nombre-facture',
  auth,
  gestionFactureController.nombreFactures
);

// -------------------- CONSULTER FACTURE --------------------
router.get(
  '/consulter-facture/:id',
  auth,
  gestionFactureController.consulterFacture
);

// -------------------- LISTE FACTURE --------------------
router.get(
  '/liste-factures',
  auth,
  gestionFactureController.listeFacture
);

module.exports = router;
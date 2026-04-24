const express = require('express');
const router = express.Router();

const QuittanceLoyerController = require('../../../controllers/professionnel/quittanceLoyer/quittanceLoyerController');

// 👉 middleware auth obligatoire
const authMiddleware = require('../../../middlewares/auth.middleware');

// ============================================================
// 🔹 ROUTES QUITTANCE DE LOYER
// ============================================================

// créer une quittance de loyer
router.post(
  '/creation-quittance-loyer',
  authMiddleware,
  QuittanceLoyerController.creerQuittance
);

// mes quittances (bailleur)
router.get(
  '/',
  authMiddleware,
  QuittanceLoyerController.getMesQuittances
);

// détail d’une quittance
router.get(
  '/:quittanceId',
  authMiddleware,
  QuittanceLoyerController.getQuittance
);

// télécharger PDF quittance
router.get(
  '/:quittanceId/download',
  authMiddleware,
  QuittanceLoyerController.telechargerQuittance
);

module.exports = router;
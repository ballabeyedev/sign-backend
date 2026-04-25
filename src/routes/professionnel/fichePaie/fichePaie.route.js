const express = require('express');
const router = express.Router();

const FichePaieController = require('../../../controllers/professionnel/fichePaie/fichePaie.Controller');

// 👉 middleware auth obligatoire
const authMiddleware = require('../../../middlewares/auth.middleware');

// ============================================================
// 🔹 ROUTES FICHE DE PAIE
// ============================================================

// créer une fiche de paie
router.post(
  '/creation-fiche-paie',
  authMiddleware,
  FichePaieController.creerFichePaie
);

// mes fiches de paie
router.get(
  '/',
  authMiddleware,
  FichePaieController.getMesFichesPaie
);

// détail d’une fiche de paie
router.get(
  '/:fichePaieId',
  authMiddleware,
  FichePaieController.getFichePaie
);

// télécharger PDF fiche de paie
router.get(
  '/:fichePaieId/download',
  authMiddleware,
  FichePaieController.telechargerFichePaie
);

module.exports = router;
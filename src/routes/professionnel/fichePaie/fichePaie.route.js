const express = require('express');
const router = express.Router();

const FichePaieController = require('../../../controllers/professionnel/fichePaie/fichePaie.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

// ============================================================
// 🔹 ROUTES FICHE DE PAIE
// ============================================================

// Créer une fiche de paie
router.post(
  '/creation-fiche-paie',
  authMiddleware,
  FichePaieController.creerFichePaie
);

// Lister mes fiches de paie
router.get(
  '/',
  authMiddleware,
  FichePaieController.getMesFichesPaie
);

// Détail d'une fiche de paie
router.get(
  '/fiches-paie/:fichePaieId',
  authMiddleware,
  FichePaieController.getFichePaie
);

// Télécharger le PDF d'une fiche
router.get(
  '/fiches-paie/:fichePaieId/download',
  authMiddleware,
  FichePaieController.telechargerFichePaie
);

module.exports = router;
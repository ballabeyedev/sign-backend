const express = require('express');
const router = express.Router();
const gestionUtilisateurController = require('../../controllers/admin/gestionutilisateur.controller');
const auth = require('../../middlewares/auth.middleware');

router.get(
  '/nombre-utilisateur',
  auth,
  gestionUtilisateurController.listeUtilisateur
);

router.get(
  '/liste-utilisateur',
  gestionUtilisateurController.nombreUtilisateur
);

module.exports = router;

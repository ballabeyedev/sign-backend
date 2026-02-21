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
  auth,
  gestionUtilisateurController.nombreUtilisateur
);

router.get(
  '/nombre-particuliers',
  auth,
  gestionUtilisateurController.nombreParticuliers
);

router.get(
  '/nombre-independants',
  auth,
  gestionUtilisateurController.nombreIndependants
);

router.get(
  '/nombre-professionnel',
  auth,
  gestionUtilisateurController.nombreProfessionnels
);
module.exports = router;

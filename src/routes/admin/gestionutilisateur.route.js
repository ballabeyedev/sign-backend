const express = require('express');
const router = express.Router();
const gestionUtilisateurController = require('../../controllers/admin/gestionutilisateur.controller');
const auth = require('../../middlewares/auth.middleware');

router.get(
  '/nombre-utilisateur',
  auth,
  gestionUtilisateurController.nombreUtilisateur
);

router.get(
  '/liste-utilisateur',
  auth,
  gestionUtilisateurController.listeUtilisateur
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
  '/nombre-professionnels',
  auth,
  gestionUtilisateurController.nombreProfessionnels
);

router.patch(
  '/activer-utilisateur/:id',
  auth,
  gestionUtilisateurController.activerUtilisateur
);

router.patch(
  '/desactiver-utilisateur/:id',
  auth,
  gestionUtilisateurController.desactiverUtilisateur
);

module.exports = router;
const express = require('express');
const router = express.Router();
const gestionClientController = require('../../controllers/professionnel/gestionclient.controller');
const auth = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

router.post(
  '/ajout-client',
  auth,
  upload.single('photoProfil'),
  gestionClientController.ajoutClient
);

router.put(
  '/modifier-client',
  auth,
  upload.single('photoProfil'),
  gestionClientController.modificationClient
);

router.get(
  '/recherche-client',
  auth,
  gestionClientController.rechercherClient
);

router.get(
  '/liste-clients',
  auth,
  gestionClientController.listerClients
);

module.exports = router;

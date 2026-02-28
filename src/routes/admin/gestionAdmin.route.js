const express = require('express');
const router = express.Router();
const gestionAdminController = require('../../controllers/admin/gestionAdmin.controller');
const auth = require('../../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get(
  '/nombre-admins',
  auth,
  gestionAdminController.nombreAdmin
);

router.post(
  '/ajout-admins',
  auth,
  upload.single('photoProfil'), // un seul fichier nommé 'photoProfil'
  gestionAdminController.ajoutAdmin
);

router.get(
  '/liste-admins',
  auth,
  gestionAdminController.listeAdmin
);

module.exports = router;
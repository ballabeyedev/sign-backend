const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post(
  '/register',
  upload.fields([
    { name: 'photoProfil', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  authController.inscriptionUser
);
router.post('/login', authController.login);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.single('photoProfil'), authController.inscriptionUser);
router.post('/login', authController.login);

module.exports = router;

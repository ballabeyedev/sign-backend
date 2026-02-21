const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const upload = require('../middlewares/upload.middleware');
const auth = require('../middlewares/auth.middleware');
const checkActiveUser = require('../middlewares/checkActiveUser.middleware');

router.post(
  '/updateProfile',
  auth,
  checkActiveUser,
  upload.single('photoProfil'),
  accountController.updateProfile
);

router.post(
  '/forgot-password',
  accountController.forgotPassword
);

router.put(
  '/change-password',
  auth,
  checkActiveUser,
  accountController.changePassword
);

router.put(
  '/deactivate-account',
  auth,
  checkActiveUser,
  accountController.deactivateAccount
);

router.put(
  '/activate-account',
  auth,
  accountController.activateAccount
);

router.put(
  '/toggle-account-status',
  auth,
  accountController.toggleAccountStatus
);

module.exports = router;

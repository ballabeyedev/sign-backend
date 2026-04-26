const router = require('express').Router();
const C = require('../../../controllers/professionnel/fichePaie/fichePaie.controller');
const auth = require('../../../middlewares/auth.middleware');

router.post('/cree-fiches-paie', auth, C.creerFichePaie);
router.get('/fiches-paie', auth, C.getMesFichesPaie);
router.get('/fiches-paie/:fichePaieId', auth, C.getFichePaie);
router.get('/fiches-paie/:fichePaieId/download', auth, C.telechargerFichePaie);

module.exports = router;
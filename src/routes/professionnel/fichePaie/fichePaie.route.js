const router = require('express').Router();
const C = require('../../../controllers/professionnel/fichePaie/fichePaie.controller');
const auth = require('../../../middlewares/auth.middleware');

router.post('/cree-fiches-paie', auth, C.creerFichePaie);
router.get('/mes-fiches-paie', auth, C.getMesFichesPaie);
router.get('/fiche-paie/:fichePaieId', auth, C.getFichePaie);
router.get('/fiche-paie/:fichePaieId/download', auth, C.telechargerFichePaie);

module.exports = router;
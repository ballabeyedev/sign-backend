const express    = require('express');
const router     = express.Router();
const contratController = require('../../../controllers/professionnel/contraImmobilier/generationcontrat.controller');
const auth = require('../../../middlewares/auth.middleware');
const checkActiveUser = require('../../../middlewares/checkActiveUser.middleware');

// Toutes les routes sont protégées
router.use(auth);
router.use(checkActiveUser);


// POST   /api/contrats                  → Créer un contrat de bail
router.post('/creation-contrat-immobilier',         contratController.creerContrat);

// GET    /api/contrats                  → Lister mes contrats
router.get('/',                   contratController.getMesContrats);

// GET    /api/contrats/:id              → Détail d'un contrat
router.get('/:id',                contratController.getContratById);

// GET    /api/contrats/:id/telecharger  → Télécharger le PDF
router.get('/:id/telecharger',    contratController.telechargerContrat);

// PATCH  /api/contrats/:id/resilier     → Résilier un contrat
router.patch('/:id/resilier',     contratController.resilierContrat);

module.exports = router;
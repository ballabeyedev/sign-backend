const GestionUtilisateurService = require('../../services/admin/gestionutilisateur.service');
const formatUser = require('../../utils/formatUser'); // pour formater les utilisateurs

// -------------------- LISTE DES UTILISATEURS --------------------
exports.listeUtilisateur = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await GestionUtilisateurService.listerUtilisateurs({ page, limit });

    const utilisateursFormates = result.utilisateurs.map(user => formatUser(user));

    return res.status(200).json({
      message: result.message,
      pagination: result.pagination,
      utilisateurs: utilisateursFormates
    });

  } catch (error) {
    console.error("Erreur dans listeUtilisateur :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors de la récupération des utilisateurs"
    });
  }
};

// -------------------- NOMBRE D'UTILISATEURS --------------------
exports.nombreUtilisateur = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreUtilisateurs();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreUtilisateur :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des utilisateurs"
    });
  }
};

<<<<<<< HEAD
// -------------------- NOMBRE DE PARTICULIERS --------------------
exports.nombreParticuliers = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreParticuliers();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreParticuliers :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des particuliers"
    });
  }
};

// -------------------- NOMBRE D'INDEPENDANTS --------------------
exports.nombreIndependants = async (req, res) => {
  try {
    const result = await GestionUtilisateurService.nombreIndependants();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans nombreIndependants :", error);
    return res.status(500).json({
      message: "Une erreur est survenue lors du comptage des independants"
    });
  }
};

// -------------------- NOMBRE PROFESSIONNELS --------------------
exports.nombreProfessionnels = async (req, res) => {
  try {
    const count = await GestionUtilisateurService.nombreProfessionnels();
    return res.status(200).json({
      success: true,
      count: count,
=======
// -------------------- NOMBRE PROFESSIONNELS --------------------
exports.nombreUtilisateur = async (req, res) => {
  try {
    const count = await Professionnel.countDocuments();
    return res.status(200).json({
      success: true,
      count: count,
      message: `Nombre de professionnels récupéré avec succès`
>>>>>>> a5ba6788bb25efcf82b187c1f3759125cb8f69bd
    });
  } catch (error) {
    console.error('Erreur lors du comptage des professionnels:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre de professionnels',
      error: error.message
    });
  }
<<<<<<< HEAD
}  
=======
};
>>>>>>> a5ba6788bb25efcf82b187c1f3759125cb8f69bd

const AuthService = require('../services/auth.service');
const formatUser = require('../utils/formatUser');

exports.inscriptionUser = async (req, res) => {
  // On récupère tous les champs depuis le body
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    adresse,
    telephone,
    carte_identite_national_num,
    role
  } = req.body;

  const photoProfil = req.file ? req.file : null;

  try {
    const { utilisateur, error } = await AuthService.register({
      nom,
      prenom,
      email,
      mot_de_passe,
      adresse,
      telephone,
      photoProfil,
      carte_identite_national_num,
      role
    });

    if (error) return res.status(400).json({ message: error });

    return res.status(201).json({
      message: 'Inscription réussie',
      utilisateur: formatUser(utilisateur)
    });
  } catch (err) {
    console.error('Erreur lors de l’inscription :', err);
    return res.status(500).json({
      message: 'Erreur serveur lors de l’inscription',
      erreur: err.message
    });
  }
};

exports.login = async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  try {
    const { token, utilisateur, error } = await AuthService.login({ identifiant, mot_de_passe });

    if (error) return res.status(400).json({ message: error });

    return res.status(200).json({
      token,
      utilisateur: formatUser(utilisateur)
    });
  } catch (err) {
    console.error('Erreur connexion:', err);
    return res.status(500).json({
      message: 'Erreur serveur',
      erreur: err.message
    });
  }
};

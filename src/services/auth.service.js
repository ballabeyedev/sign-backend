const Utilisateur = require('../models/utilisateur.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtConfig, bcryptConfig } = require('../config/security');
const sequelize = require('../config/db');
const { uploadImage } = require('../middlewares/uploadService'); // ton upload vers Cloudinary


class AuthService {

  // -------------------- INSCRIPTION --------------------
static async register({
  nom,
  prenom,
  email,
  mot_de_passe,
  adresse,
  telephone,
  carte_identite_national_num,
  photoProfil,
  role = 'Particulier',
  logo,
  rc,
  ninea
}) {
  const t = await sequelize.transaction();

  try {
    const emailClean = email.trim().toLowerCase();

    const exist = await Utilisateur.findOne({
      where: { email: emailClean },
      transaction: t
    });

    if (exist) {
      await t.rollback();
      return {
        success: false,
        message: "Cet email est déjà utilisé"
      };
    }

    if (telephone) {
      const telExist = await Utilisateur.findOne({
        where: { telephone },
        transaction: t
      });

      if (telExist) {
        await t.rollback();
        return {
          success: false,
          message: "Ce numéro de téléphone est déjà utilisé"
        };
      }
    }

    if (carte_identite_national_num) {
      const numero_cniExist = await Utilisateur.findOne({
        where: { carte_identite_national_num },
        transaction: t
      });

      if (numero_cniExist) {
        await t.rollback();
        return {
          success: false,
          message: "Ce numéro de carte identite est déjà utilisé"
        };
      }
    }


    const hashedPassword = await bcrypt.hash(
      mot_de_passe,
      bcryptConfig.saltRounds
    );

    let photoUrl = null;

    if (photoProfil && photoProfil.path) {
      photoUrl = await uploadImage(photoProfil.path);
    }

    let logo= null;

    if (logo && logo.path) {
      logo = await uploadImage(logo.path);
    }


    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email: emailClean,
      mot_de_passe: hashedPassword,
      adresse,
      telephone,
      carte_identite_national_num,
      photoProfil: photoUrl,
      role,
      logo,
      rc,
      ninea
    }, { transaction: t });

    await t.commit();

    return {
      success: true,
      message: "Inscription réussie",
      utilisateur
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
}


  // -------------------- CONNEXION --------------------
  static async login({ identifiant, mot_de_passe }) {
    const isEmail = /\S+@\S+\.\S+/.test(identifiant);
    const utilisateur = await Utilisateur.findOne({
      where: isEmail ? { email: identifiant } : { telephone: identifiant },
    });

    if (!utilisateur) 
      return { 
        success: false,
        error: 'Identifiant ou mot de passe incorrect' 
      };
     if (utilisateur.statut !== 'actif') {
        return {
          success: false,
          message: `Compte ${utilisateur.statut}`
        };
      }

    const valid = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!valid) {
      return {
        success: false,
        message: 'Identifiant ou mot de passe incorrect'
      };
    }

    const token = jwt.sign({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      adresse: utilisateur.adresse,
      telephone: utilisateur.telephone,
      photoProfil: utilisateur.photoProfil,
      carte_identite_national_num: utilisateur.carte_identite_national_num,
      role: utilisateur.role,
      rc:utilisateur.rc,
      ninea: utilisateur.ninea
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

    return {success: true, token, utilisateur };
  }

}

module.exports = AuthService;

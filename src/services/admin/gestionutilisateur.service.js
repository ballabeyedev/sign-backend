const Utilisateur = require('../../models/utilisateur.model');
const { Op } = require('sequelize');

class GestionUtilisateurService {

  static async listerUtilisateurs({ page = 1, limit = 10 }) {
    try {
      const currentPage = Math.max(1, parseInt(page, 10));
      const pageSize = Math.max(1, parseInt(limit, 10));
      const offset = (currentPage - 1) * pageSize;

      const { count, rows } = await Utilisateur.findAndCountAll({
        attributes: { exclude: ['mot_de_passe'] },
        where: {
          role: { [Op.ne]: 'Admin' }
        },
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        message: "Liste des utilisateurs",
        pagination: {
          totalUtilisateurs: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage,
          pageSize
        },
        utilisateurs: rows
      };

    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async nombreUtilisateurs() {
    const total = await Utilisateur.count({
      where: { role: { [Op.ne]: 'Admin' } }
    });

    return {
      message: "Nombre total d'utilisateurs",
      totalUtilisateurs: total
    };
  }

  static async nombreParticuliers() {
    const total = await Utilisateur.count({
      where: { role: 'Particulier' }
    });

    return { 
      message: "Nombre total particulier",
      totalParticuliers: total 
    };
  }

  static async nombreIndependants() {
    const total = await Utilisateur.count({
      where: { role: 'Independant' }
    });

    return {
      message: "Nombre total d'independant",
      totalIndependants: total 
    };
  }

  static async nombreProfessionnels() {
    const total = await Utilisateur.count({
      where: { role: 'Professionnel' }
    });

    return {
      message: "Nombre total de professionnel",
      totalProfessionnels: total 
    };
  }

  static async activerUtilisateur(id) {
  try {

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      throw new Error("Utilisateur introuvable");
    }

     await utilisateur.update({ statut: "actif" });

    return {
      message: "Utilisateur activé avec succès",
      utilisateur
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

static async desactiverUtilisateur(id) {
  try {

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      throw new Error("Utilisateur introuvable");
    }

    await utilisateur.update({ statut: "inactif" });

    return {
      message: "Utilisateur désactivé avec succès",
      utilisateur
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

}

module.exports = GestionUtilisateurService;
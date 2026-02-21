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
          role: { [Op.ne]: 'admin' }
        },
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        message: "Liste des utilisateurs (hors admins)",
        pagination: {
          totalUtilisateurs: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage,
          pageSize
        },
        utilisateurs: rows
      };

    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
      throw error;
    }
  }

  // -------------------- NOMBRE D'UTILISATEURS --------------------
  static async nombreUtilisateurs() {
    try {
      const total = await Utilisateur.count({
        where: {
          role: { [Op.ne]: 'admin' }
        }
      });

      return {
        message: "Nombre total d'utilisateurs (hors admins)",
        totalUtilisateurs: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des utilisateurs :", error);
      throw error;
    }
  }

<<<<<<< HEAD
  // -------------------- NOMBRE DE PARTICULIERS --------------------
  static async nombreParticuliers() {
    try {
      const total = await Utilisateur.count({
        where: {
          role: 'Particulier'
        }
      });

      return {
        message: "Nombre total de particuliers",
        totalParticuliers: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des particuliers :", error);
      throw error;
    }
  }


  // -------------------- NOMBRE D'INDEPENDANTS --------------------
  static async nombreIndependants() {
    try {
      const total = await Utilisateur.count({
        where: {
          role: 'Independant'
        }
      });

      return {
        message: "Nombre total d'Independant",
        totalIndependant: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des independants :", error);
      throw error;
    }
  }


=======
>>>>>>> a5ba6788bb25efcf82b187c1f3759125cb8f69bd
  // -------------------- NOMBRE PROFESSIONNELS --------------------
  static async nombreProfessionnels() {
    try {
      const total = await Utilisateur.count({
        where: {
<<<<<<< HEAD
          role: "Professionnel"
=======
          role: { [Op.ne]: 'admin' } 
>>>>>>> a5ba6788bb25efcf82b187c1f3759125cb8f69bd
        }
      });

      return {
        message: "Nombre total de professionnels",
        totalProfessionnels: total
      };
    } catch (error) {
      console.error("Erreur lors du comptage des professionnels :", error);
      throw error;
    }
  }

}

module.exports = GestionUtilisateurService;
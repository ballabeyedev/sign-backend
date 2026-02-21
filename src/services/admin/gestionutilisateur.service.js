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
      console.error(error);
      throw error;
    }
  }

  static async nombreUtilisateurs() {
    const total = await Utilisateur.count({
      where: { role: { [Op.ne]: 'admin' } }
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

    return { totalParticuliers: total };
  }

  static async nombreIndependants() {
    const total = await Utilisateur.count({
      where: { role: 'Independant' }
    });

    return { totalIndependants: total };
  }

  static async nombreProfessionnels() {
    const total = await Utilisateur.count({
      where: { role: 'Professionnel' }
    });

    return { totalProfessionnels: total };
  }

}

module.exports = GestionUtilisateurService;
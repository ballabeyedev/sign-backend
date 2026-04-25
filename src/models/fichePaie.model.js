const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FichePaie = sequelize.define('FichePaie', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  numero_fiche: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — EMPLOYEUR
  // ══════════════════════════════════════════════════════════════
  type_employeur: {
    type: DataTypes.ENUM('Particulier', 'Entreprise'),
    allowNull: false
  },

  nom_entreprise: {
    type: DataTypes.STRING,
    allowNull: false
  },

  ninea: {
    type: DataTypes.STRING,
    allowNull: true
  },

  adresse_employeur: {
    type: DataTypes.STRING,
    allowNull: false
  },

  telephone_employeur: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — SALARIÉ
  // ══════════════════════════════════════════════════════════════
  nom_salarie: {
    type: DataTypes.STRING,
    allowNull: false
  },

  prenom_salarie: {
    type: DataTypes.STRING,
    allowNull: false
  },

  numero_cni: {
    type: DataTypes.STRING,
    allowNull: false
  },

  numero_ipres: {
    type: DataTypes.STRING,
    allowNull: true
  },

  numero_css: {
    type: DataTypes.STRING,
    allowNull: true
  },

  poste: {
    type: DataTypes.STRING,
    allowNull: false
  },

  date_embauche: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — CONTRAT
  // ══════════════════════════════════════════════════════════════
  type_contrat: {
    type: DataTypes.ENUM('CDI', 'CDD', 'Intérim', 'Domestique'),
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — PÉRIODE
  // ══════════════════════════════════════════════════════════════
  mois: {
    type: DataTypes.ENUM(
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ),
    allowNull: false
  },

  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION — SALAIRE
  // ══════════════════════════════════════════════════════════════
  salaire_brut: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  mode_calcul: {
    type: DataTypes.ENUM('Mensuel', 'Journalier', 'Horaire'),
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // TEMPS DE TRAVAIL
  // ══════════════════════════════════════════════════════════════
  jours_travailles: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  heures_travaillees: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  absence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  jours_absence: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  type_absence: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // HEURES SUPPLÉMENTAIRES
  // ══════════════════════════════════════════════════════════════
  heures_supplementaires: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },

  taux_heure_supp: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // PRIMES
  // ══════════════════════════════════════════════════════════════
  prime_transport: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_logement: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_performance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  prime_exceptionnelle: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  autres_primes: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // AVANTAGES EN NATURE
  // ══════════════════════════════════════════════════════════════
  avantages_nature: {
    type: DataTypes.STRING,
    allowNull: true
  },

  valeur_avantages: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // CONGÉS
  // ══════════════════════════════════════════════════════════════
  conges_pris: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  jours_conges: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  montant_conges: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // RETENUES
  // ══════════════════════════════════════════════════════════════
  avance_salaire: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  autres_retenues: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  motif_retenue: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // COTISATIONS
  // ══════════════════════════════════════════════════════════════
  soumis_ipres: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  soumis_css: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  mutuelle: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // IMPÔTS
  // ══════════════════════════════════════════════════════════════
  soumis_ir: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  situation_familiale: {
    type: DataTypes.ENUM('Célibataire', 'Marié'),
    allowNull: false
  },

  nombre_enfants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // ══════════════════════════════════════════════════════════════
  // PAIEMENT
  // ══════════════════════════════════════════════════════════════
  mode_paiement: {
    type: DataTypes.ENUM('Espèces', 'Virement bancaire', 'Wave / Orange Money'),
    allowNull: false
  },

  date_paiement: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // ══════════════════════════════════════════════════════════════
  // 🔥 AJOUT CALCULS (IMPORTANT)
  // ══════════════════════════════════════════════════════════════
  total_gains: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  total_retenues: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  salaire_net: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },

  // ══════════════════════════════════════════════════════════════
  // FINAL
  // ══════════════════════════════════════════════════════════════
  fiche_pdf: {
    type: DataTypes.TEXT('long'),
    comment: 'PDF encodé en base64'
    
  }

}, {
  tableName: 'FichePaie',
  timestamps: true
});

module.exports = FichePaie;
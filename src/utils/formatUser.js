const formatUser = (utilisateur) => ({
  id: utilisateur.id,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  email: utilisateur.email,
  adresse: utilisateur.adresse,
  telephone: utilisateur.telephone,
  photoProfil: utilisateur.photoProfil,
  carte_identite_national_num: utilisateur.carte_identite_national_num,
  role: utilisateur.role,
  logo: utilisateur.logo,
  rc: utilisateur.rc,
  ninea: utilisateur.ninea
});

module.exports = formatUser;

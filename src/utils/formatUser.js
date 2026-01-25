const formatUser = (utilisateur) => ({
  id: utilisateur.id,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  email: utilisateur.email,
  adresse: utilisateur.adresse,
  telephone: utilisateur.telephone,
  photoProfil: utilisateur.photoProfil,
  carte_identite_national_num: utilisateur.carte_identite_national_num,
  role: utilisateur.role
});

module.exports = formatUser;

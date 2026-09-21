const LIBELLE_PATIENT = { a_demarrer: 'À démarrer', en_cours: 'En cours', termine: 'Terminé' };

export const libelleStatutPatient = (statut) => LIBELLE_PATIENT[statut];

// Dates ISO (UTC) renvoyées par l'API, affichées à l'heure du navigateur
export const dateHeure = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

// Accepte une date seule (« 2027-04-11 ») ou un horodatage ISO
export const dateSeule = (valeur) =>
  new Date(valeur.length === 10 ? `${valeur}T12:00:00` : valeur).toLocaleDateString('fr-FR', { dateStyle: 'long' });

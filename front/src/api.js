const CLE_JETON = 'via-sana-jeton';

export const jeton = {
    lire: () => localStorage.getItem(CLE_JETON),
    ecrire: (valeur) => localStorage.setItem(CLE_JETON, valeur),
    effacer: () => localStorage.removeItem(CLE_JETON),
};

export class ErreurApi extends Error {
    constructor(statut, message) {
        super(message);
        this.statut = statut;
    }
}

// Appelle l'API (chemin sans le préfixe /api) et renvoie le JSON
export async function appeler(chemin, { methode = 'GET', corps } = {}) {
    const entetes = {};
    if (corps) entetes['Content-Type'] = 'application/json';
    if (jeton.lire()) entetes.Authorization = `Bearer ${jeton.lire()}`;

    const reponse = await fetch(`/api${chemin}`, {
        method: methode,
        headers: entetes,
        body: corps ? JSON.stringify(corps) : undefined,
    });
    const donnees = await reponse.json().catch(() => null);

    if (!reponse.ok) {
        // Jeton expiré ou invalide : on prévient AuthProvider (sauf pour la connexion elle-même)
        if (reponse.status === 401 && chemin !== '/login') window.dispatchEvent(new Event('session-expiree'));
        throw new ErreurApi(reponse.status, donnees?.erreur || 'Une erreur est survenue');
    }
    return donnees;
}
export const THEMES = [
    { valeur: 'prepamarathon', libelle: 'PrépaMarathon' },
    { valeur: 'light', libelle: 'Clair' },
    { valeur: 'dark', libelle: 'Sombre' },
];

const CLE_THEME = 'via-sana-theme';
const THEME_PAR_DEFAUT = 'prepamarathon';

export function themeInitial() {
    try {
        const enregistre = localStorage.getItem(CLE_THEME);
        return THEMES.some((t) => t.valeur === enregistre) ? enregistre : THEME_PAR_DEFAUT;
    } catch {
        return THEME_PAR_DEFAUT;
    }
}

export function appliquerTheme(valeur) {
    document.documentElement.dataset.theme = valeur;
    try {
        localStorage.setItem(CLE_THEME, valeur);
    } catch {
        // stockage indisponible : le thème s'applique pour la session seulement
    }
}
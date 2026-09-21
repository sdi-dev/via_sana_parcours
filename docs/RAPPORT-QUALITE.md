# Rapport qualité : accessibilité, responsive, performance

## Méthode

- **Lighthouse 13** (Chromium sans interface), modes mobile et bureau, sur 4 pages : connexion, liste des patients, fiche patient, vue patient (session injectée pour les pages protégées).
- **axe-core** : 6 pages × 3 thèmes (PrépaMarathon, clair, sombre) × 2 largeurs (375 et 1280 px), soit 36 configurations, avant et après défilement de la page.
- **Responsive** : grille des étapes contrôlée de 375 à 1440 px (colonnes, débordements horizontaux).
- **Serveur de mesure** : Express en local, tel que déployé (sans compression ni en-têtes de sécurité), sur la base de démonstration.

## Résultats

| Page | Mode | Perf. | Access. | Bonnes prat. | SEO | CLS | LCP (ms) |
|---|---|---|---|---|---|---|---|
| connexion | mobile | 84 | 100 | 100 | 100 | 0.047 | 3463 |
| connexion | bureau | 100 | 100 | 100 | 100 | 0.004 | 298 |
| liste des patients | mobile | 95 | 100 | 100 | 100 | 0.001 | 1505 |
| liste des patients | bureau | 100 | 100 | 100 | 100 | 0 | 429 |
| fiche patient | mobile | 97 | 100 | 100 | 100 | 0.032 | 1452 |
| fiche patient | bureau | 100 | 100 | 100 | 100 | 0.007 | 417 |
| vue patient | mobile | 99 | 100 | 100 | 100 | 0.054 | 1343 |
| vue patient | bureau | 100 | 100 | 100 | 100 | 0.015 | 382 |

- **axe-core** : 0 violation sur les 36 configurations, avec et sans défilement (les sections qui apparaissent au défilement ne masquent aucun contenu aux outils).
- **Responsive** : aucun débordement horizontal. Étapes en 5 colonnes dès 1024 px, 3 + 2 sur tablette, 2 puis 1 colonne sur mobile.
- Le CSS (83 Ko) est servi sans compression et bloque le rendu : c'est le principal facteur du LCP mobile de la page de connexion.

## Choix d'accessibilité

- Un statut n'est jamais porté par la couleur seule : icône et libellé.
- Orange de marque `#EC6E48` réservé aux fonds (texte foncé dessus, contraste 4,97) ; `#B93A13` pour le texte orange sur fond clair (5,1).
- Thème sombre : primaire éclairci (`#8B89FF`) pour atteindre 4,5 de contraste.
- Bordures de champs à 62 % d'opacité (composants d'interface, 3:1 minimum).
- Chiffres et mots décoratifs en pseudo-éléments ; icônes masquées aux lecteurs d'écran.
- Zones `aria-live` pour les retours, labels sur tous les champs, `lang="fr"`, lien « Aller au contenu », focus clavier visible.
- `prefers-reduced-motion` : animations et apparitions au défilement désactivées.

## Limites

- Mesures locales, un seul passage, processeur lent : sans latence réseau, les temps sont indicatifs. À refaire sur l'URL déployée, service réveillé.
- Aucun test avec lecteur d'écran (NVDA, VoiceOver) ni sur de vrais appareils.
- Verdana n'est pas embarquée : elle est remplacée par une police sans empattement sur Linux et Android.
- Compression et en-têtes de sécurité HTTP non configurés côté Express.

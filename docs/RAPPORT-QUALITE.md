# Rapport qualité : responsive, accessibilité, performance

## Méthode

- **Application** servie par Express en local, sur la base seedée. Le serveur de mesure utilisait une configuration (compression, en-têtes de sécurité) qui **n'est pas celle du serveur déployé** : voir Limites.
- **Lighthouse 13.5** (Chromium 153 sans interface), modes mobile et bureau, sur 4 pages : connexion, liste des patients, fiche patient, vue patient.
- **axe-core** dans le navigateur : 5 pages × 3 thèmes (PrépaMarathon, clair, sombre) × 3 tailles d'écran (375, 768 et 1280 px), soit 45 combinaisons.
- **Navigation au clavier** automatisée (touche Tab) sur la connexion et la liste des patients.
- **Débordement horizontal** mesuré sur chaque combinaison.

## Résultats

| Page | Mode | Performance | Accessibilité | Bonnes pratiques | SEO | CLS |
|---|---|---|---|---|---|---|
| Connexion | mobile | 100 | 100 | 100 | 100 | 0 |
| Liste des patients | mobile | 100 | 100 | 100 | 100 | 0 |
| Fiche patient | mobile | 100 | 100 | 100 | 100 | 0 |
| Vue patient | mobile | 100 | 100 | 100 | 100 | 0 |
| Les 4 pages | bureau | 100 | 100 | 100 | 100 | 0 |

- **axe-core** : 0 violation sur les 45 combinaisons (contrastes vérifiés par le navigateur).
- **Responsive** : aucun débordement horizontal à 375, 768 et 1280 px. Sous 768 px, le tableau des patients devient une liste de cartes.
- **Clavier** : lien « Aller au contenu » en premier, ordre de tabulation logique, contour de focus visible sur tous les éléments interactifs testés.

## Choix d'accessibilité

- Un statut n'est jamais porté par la couleur seule : symbole + libellé.
- Orange de marque `#EC6E48` réservé aux fonds (texte foncé dessus, contraste 4,97). Pour le texte orange sur fond clair : `#B93A13` (contraste 5,1).
- Thème sombre : primaire éclairci (`#8B89FF`) pour atteindre 4,5 de contraste.
- Bordures de champs à 62 % d'opacité (composants d'interface, 3:1 minimum).
- Chiffres et mots décoratifs en pseudo-éléments, absents du texte lu par les lecteurs d'écran.
- Zones `aria-live` pour les messages de retour, labels sur tous les champs, `lang="fr"`, animations réduites si `prefers-reduced-motion`.

## Corrigé pendant l'audit

| Problème détecté | Correction |
|---|---|
| Logo orange sur crème : contraste 2,7 | orange assombri dans l'en-tête, orange vif sur le pied de page sombre |
| En-têtes de tableau trop pâles (4,1) | couleur de texte pleine |
| Décalage de mise en page de 0,5 à l'apparition des données | en-tête et pied de page affichés seulement une fois la session restaurée, contenu d'une hauteur minimale |
| Tuiles : nom accessible différent du texte visible | texte visible = nom accessible |
| Pas de meta description, `robots.txt` invalide | ajoutés |
| Tableau tronqué sur mobile | cartes empilées |

## Limites

- **Configuration différente de la production.** Les mesures ont été faites avec un serveur configuré avec compression et en-têtes de sécurité HTTP, absents du serveur déployé (Express sert les fichiers du front tels quels). Les scores de performance et de bonnes pratiques sont donc à refaire sur l'URL Render.
- Mesures faites en local : pas de latence réseau, et le processeur du serveur de test est lent. Le temps de calcul « main thread » (informatif, sans effet sur la note) est pessimiste. **À refaire sur l'URL Render**, après avoir réveillé le service.
- Aucun test avec un lecteur d'écran (NVDA, VoiceOver) ni sur de vrais appareils.
- Verdana n'est pas embarquée : elle est remplacée par une police sans empattement sur Linux et Android.
- Pas de limitation du nombre de tentatives de connexion ; jeton stocké dans `localStorage`.

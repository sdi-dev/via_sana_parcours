# Cheminement : comment j'ai abordé le case Via Sana

Support pour l'oral. Chaque partie dit **ce que j'ai fait**, **pourquoi**, et une phrase prête à dire. Adapte les formulations à ce que tu peux expliquer avec tes mots : tout ce qui figure ici doit pouvoir être justifié devant le jury.

---

## Le pitch en 30 secondes

> « Via Sana coordonne plusieurs professionnels de santé autour d'un même coureur, mais avec des outils dispersés. J'ai construit un prototype fonctionnel : côté praticien, une liste de patients filtrable et une fiche qui rassemble le parcours, les séances, les notes et le questionnaire ; côté patient, une vue claire de son parcours. Le tout est en ligne, avec une vraie base de données, une vraie authentification par rôle, et une interface aux couleurs de PrépaMarathon, accessible et responsive. »

## Plan de l'oral (environ 12 minutes)

| Durée | Partie |
|---|---|
| 1 min | le besoin et ma compréhension |
| 3 min | ma démarche : hypothèses, choix techniques, modèle de données |
| 4 min | démonstration (scénario en fin de document) |
| 2 min | qualité : tests, sécurité, accessibilité, performance |
| 1 min | limites et perspectives |
| 1 min | buffer, puis questions |

---

## 1. Comprendre le besoin

**Ce que j'ai fait.** J'ai séparé ce que le brief demande explicitement de ce qu'il laisse sous-entendu.

- **Explicite** : une interface praticien (liste, filtres, fiche, étapes réalisées, en cours et à venir, notes de suivi) et une interface patient simplifiée (formulaire, parcours, séances).
- **Sous-entendu** : « logique structurée (données, flux, organisation) », « capacité à connecter différents éléments », et un prototype « clair, robuste et bien pensé », donc pas un simple écran de démonstration.

**Ce que je dis.** « J'ai lu le brief comme un test de structuration : le rendu compte, mais surtout la manière dont les données et les rôles sont organisés. »

## 2. Cadrer avec des hypothèses assumées

Je n'ai pas pu obtenir de réponse aux questions de périmètre dans le temps imparti (week-end). J'ai donc **décidé et documenté** mes hypothèses.

| Point ouvert | Mon choix |
|---|---|
| Le patient réserve-t-il ses séances ? | non, il les consulte |
| Qui crée les patients ? | pas d'inscription publique : données de démonstration |
| Les notes sont-elles visibles du patient ? | seulement celles que le praticien marque comme partagées |
| Le coordinateur de soins | un praticien avec cette spécialité |
| Le formulaire | la saisie reste chez Evalandgo ; l'appli stocke et affiche les réponses |

**Ce que je dis.** « Quand une information manquait, j'ai posé une hypothèse, je l'ai écrite dans le README et je peux la changer facilement. »

## 3. Explorer le terrain réel

**Ce que j'ai fait.** J'ai étudié le site PrépaMarathon et parcouru tout le formulaire Evalandgo (17 écrans).

- Le parcours a **5 étapes** : questionnaire, bilan kiné, plan d'action, analyse de foulée (facultative), suivi coordonné.
- Le formulaire compte une quarantaine de questions et se termine par un consentement RGPD.
- La politique de confidentialité annonce un hébergement **HDS** et une conservation de 24 mois.

**Pourquoi.** Le modèle de données et le seed viennent de ces éléments réels, pas de ma seule imagination.

## 4. Choix techniques, justifiés par le temps et la légèreté

| Couche | Choix | Pourquoi |
|---|---|---|
| Front | React, Vite, Tailwind, daisyUI | stack que je maîtrise, développement rapide, thèmes faciles |
| Back | Node.js et Express | un seul langage front et back, mise en place légère, plutôt qu'un back Java plus lourd pour un prototype |
| Base | MySQL | données **relationnelles** (patients, praticiens, étapes, séances) et filtres par jointures |
| Hébergement | Render et Aiven, un seul service | offres gratuites, déploiement continu, Express sert aussi le front |
| Dépôt | monorepo `front/` et `back/` | un seul endroit, branches par fonctionnalité |

**Ce que je dis.** « Pourquoi pas MongoDB ? Parce que mes données sont fortement liées entre elles. J'utilise un peu de JSON uniquement pour les réponses secondaires du questionnaire, où la flexibilité est utile. »

## 5. Modéliser les données

**Ce que j'ai fait.** Je suis parti des données citées dans le brief pour définir les entités, puis j'ai écrit le schéma : **10 tables**.

- **Personnes** : `utilisateur` (connexion et rôle), spécialisé en `patient` et `praticien`.
- **Parcours** : `parcours`, `etape`, et `avancement` (une ligne par patient et par étape, avec statut et date).
- **Suivi** : `seance`, `note_suivi`, `patient_praticien` (l'équipe autour du patient).
- **Questionnaire** : une table, avec les infos clés en colonnes typées et le reste en JSON.

**Arbitrages.**
- Comptes : table commune plus deux tables de profil, plutôt qu'une table fourre-tout ou deux systèmes de connexion.
- Questionnaire : colonnes pour ce qu'on affiche et filtre, JSON pour le reste, plutôt que 40 colonnes ou un JSON complet.
- Choix multiples : type `SET` de MySQL, plutôt que quatre tables de liaison, car aucun filtre n'en dépend.
- Contraintes dans la base (`CHECK`, `UNIQUE`, clés étrangères) pour qu'une donnée invalide ne puisse pas entrer, même par une autre porte.

## 6. Le formulaire : une architecture réaliste

**Ce que j'ai fait.** Le vrai flux est : le patient remplit le formulaire chez Evalandgo, l'application récupère les réponses, les stocke et les affiche. Dans le prototype, la récupération est remplacée par un **seed** ; côté patient, un bouton renvoie vers Evalandgo s'il n'a pas encore répondu.

**Ce que je dis.** « Je n'ai pas refait un formulaire que Via Sana possède déjà. J'ai modélisé la destination des données et je montre l'affichage. L'import automatique est la première évolution. »

## 7. Le back : rôles, règles métier, sécurité

- **Authentification** : mot de passe haché (bcrypt), jeton JWT de 8 h contenant l'identifiant et le rôle.
- **Droits** : chaque route vérifie le rôle. Le patient consulte « son » dossier via son jeton : il ne peut pas demander celui d'un autre.
- **Règles métier** : une étape passe de « à venir » à « en cours » puis « réalisée » ; une seule étape en cours par patient ; terminer une étape démarre la suivante ; une séance doit être dans le futur.
- **Confidentialité** : les notes privées et les e-mails des praticiens ne sont **jamais envoyés** au patient (filtrés côté API, pas seulement cachés à l'écran).
- **Sécurité** : requêtes paramétrées (pas d'injection SQL), messages de connexion qui ne révèlent pas si un compte existe. Droits, confidentialité et règles métier sont **vérifiés par 147 tests automatisés** (voir le paragraphe 10).

**Ce que je dis.** « Le principe : le navigateur guide, l'API décide, la base garantit. »

## 8. Le front : deux vues, des composants réutilisés

- La **vue patient réutilise les composants de la fiche praticien en lecture seule** : un même bloc « étapes », « notes », « séances », « questionnaire », avec ou sans actions.
- **Session** : jeton conservé dans le navigateur, restauré au rechargement, effacé si l'API répond « non connecté ».
- **Coordination entre praticiens** : l'e-mail des praticiens impliqués est affiché sur la fiche, avec un annuaire de toute l'équipe sur la liste. Le patient ne les voit pas.
- **Aide à la décision** : un bloc « Points d'attention » signale certaines réponses du questionnaire. C'est une **proposition**, à valider avec l'équipe médicale.
- **Questionnaire en PDF** : téléchargeable côté praticien et côté patient, généré dans le navigateur.

## 9. Le design : se rapprocher de la marque

**Ce que j'ai fait.** Mon premier prototype était trop simple. J'ai analysé la page d'accueil de PrépaMarathon et repris son langage visuel : sections pleines largeur (crème, bleu, vert profond), titres Oswald en capitales avec un mot en italique, pastilles, tuiles de chiffres inclinées, cartes à contour et ombre décalée, étapes en cartes numérotées à chiffres creux.

- **Trois thèmes** : PrépaMarathon (par défaut), clair, sombre.
- **Trois polices** : Oswald (titres), Libre Baskerville (textes rédigés), Verdana (interface).
- **Vie sans excès** : apparition douce des blocs, point « en cours » qui pulse, lignes de la liste cliquables et signalées ; tout est désactivé si l'utilisateur demande moins d'animations.

**Arbitrage assumé.** L'orange de la marque n'a pas un contraste suffisant pour du texte sur fond clair. Je l'ai gardé pour les fonds et les boutons, et j'utilise un orange plus foncé pour les mots en italique.

## 10. Tests, accessibilité, responsive, performance

**Tests du back.** 147 tests automatisés (Vitest et Supertest) appellent l'API contre une base MySQL de test dédiée :

- **droits par rôle** : 401 sans jeton, 403 pour le mauvais rôle, sur chaque route ;
- **confidentialité** : le patient ne voit ni les notes privées ni les e-mails des praticiens ;
- **règles métier** : transitions d'étapes, une seule étape en cours, séances dans le futur, notes de 1 à 2000 caractères ;
- **sécurité** : jetons forgés (autre secret, expiré, autre algorithme), injection SQL, recherche avec jokers ;
- **garde-fou** : les tests refusent de démarrer si la base visée n'a pas « test » dans son nom, car le seed vide toutes les tables.

**Ce que je dis.** « J'ai testé en priorité les règles qui protègent les données de santé : qui peut voir quoi, et dans quel ordre les étapes avancent. Écrire ces tests m'a fait trouver deux bugs, que j'ai corrigés. »

**Ce que je ne prétends pas.** Aucun test automatisé sur le front.

**Audit de l'interface.** J'ai audité l'application dans un vrai navigateur :

- **Lighthouse** : 100 en performance, accessibilité, bonnes pratiques et SEO, sur mobile et bureau (mesures en local, sur un serveur de test).
- **axe-core** : aucune violation sur 45 combinaisons (5 pages, 3 thèmes, 3 tailles d'écran).
- **Responsive** : aucun débordement à 375, 768 et 1280 px ; sous 768 px, le tableau devient une liste de cartes.
- **Clavier** : ordre logique, focus visible, lien « Aller au contenu ».
- **Correctifs faits grâce à l'audit** : contraste du logo, décalage de mise en page au chargement, bordures de champs, tableau tronqué sur mobile.

**Ce que je ne prétends pas.** Pas de test avec un lecteur d'écran ni sur de vrais appareils, et des mesures faites en local, sur un serveur de test configuré différemment de la production (à refaire sur le site en ligne).

## 11. Déploiement

Render (service Web relié au dépôt) et Aiven (MySQL, connexion chiffrée). J'ai déployé un **squelette très tôt** pour découvrir les blocages avant d'être fatigué : c'est là que j'ai vu que des fichiers non commités (dépendances du back, certificat de la base) faisaient échouer le premier déploiement.

## 12. Difficultés et arbitrages

- **Première authentification en Node** : réglée avec un schéma simple (bcrypt, JWT, deux garde-fous) et des messages qui ne révèlent rien.
- **Heures des séances** : décalées entre mon poste et le serveur. Solution : tout est stocké et transmis en UTC, affiché à l'heure locale.
- **Fidélité à la marque contre accessibilité** : voir le paragraphe 9.
- **Bugs trouvés par les tests** : la route `/api/health` répondait 404 (déclarée après le 404 JSON) et un JSON mal formé renvoyait 500 au lieu de 400. Corrigés.
- **Périmètre** : j'ai refusé d'ajouter des fonctions hors sujet, et j'ai mis le temps dans la qualité de ce qui est demandé.

## 13. Limites assumées

- Réponses du formulaire **seedées** : pas de connexion réelle à Evalandgo.
- Tout praticien peut modifier tout patient (pas de droits par équipe).
- Pas de limitation des tentatives de connexion ; jeton stocké dans le navigateur.
- Tests automatisés sur le back uniquement : le front n'en a pas.
- En-têtes de sécurité HTTP non configurés côté Express : à ajouter en production.
- Données de santé réelles : hébergement certifié **HDS** obligatoire en production.

## 14. Perspectives

1. **Import automatique des réponses Evalandgo** (à vérifier : export, API ou webhook), éventuellement via n8n.
2. Droits par équipe : un praticien n'écrit que sur ses patients.
3. Automatisations : e-mail au praticien à la soumission du formulaire, rappels de séances.
4. Réservation de séances par le patient, notifications.
5. Tests du front et de bout en bout, limitation des tentatives de connexion, cookies `httpOnly` à la place du stockage navigateur, en-têtes de sécurité HTTP.

---

## Scénario de démonstration (4 à 5 minutes)

Avant l'oral, **relance `npm run seed`** pour repartir de données propres, et ouvre l'application quelques instants avant (le service gratuit se réveille en une minute).

1. **Connexion** : bouton « Démo praticien » (Sam Lefèvre, kiné). Les comptes de démonstration sont volontairement visibles.
2. **Liste** : montre les tuiles (cliquables comme filtres), la recherche, le filtre par étape, le message « Cliquez sur une ligne » et le bouton « Ouvrir ».
3. **Hugo Roux** : le bloc « Points d'attention », et le bouton **Télécharger le questionnaire (PDF)**.
4. **Léa Martin** : « Terminer l'étape » du bilan kiné (la suivante démarre), ajout d'une **note partagée** et d'une **note privée**, planification d'une séance, e-mails des praticiens.
5. **Déconnexion, « Démo patient »** (Léa) : progression, prochaine séance, la note partagée mais **pas** la privée, pas d'e-mails de praticiens.
6. **Sophie Lambert** (`sophie.lambert@example.com`) : pas de questionnaire, donc le bouton vers Evalandgo.
7. **Finition** : passer au thème sombre, puis réduire la fenêtre pour montrer le mobile.

---

## Questions probables

| Question | Réponse courte |
|---|---|
| Pourquoi Node plutôt que Java ? | contrainte de temps et légèreté ; un seul langage pour tout le projet |
| Pourquoi MySQL et pas MongoDB ? | données très relationnelles ; JSON seulement pour les réponses secondaires |
| Comment empêchez-vous un patient de voir le dossier d'un autre ? | l'API lit l'identifiant dans le jeton, jamais dans l'adresse ; le rôle est contrôlé à chaque route |
| Et si quelqu'un modifie le front ? | le front guide, mais **l'API fait foi** ; la base a ses propres contraintes |
| Pourquoi des données seedées ? | le flux réel passe par Evalandgo, que je ne pouvais pas connecter ; le seed montre l'affichage sur des cas variés |
| Que se passe-t-il si Evalandgo change ses questions ? | les libellés sont centralisés dans un seul fichier, et les réponses secondaires sont en JSON, donc flexibles |
| Le jeton dans le navigateur, est-ce sûr ? | c'est un compromis de prototype, plus exposé au vol par XSS ; en production, cookie `httpOnly` |
| Et les données de santé ? | hébergement HDS et RGPD en production ; ici, uniquement des données fictives |
| Avez-vous utilisé une IA ? | **réponds honnêtement.** Exemple : « Oui, comme assistant pour aller plus vite (génération et revue de code), mais j'ai pris les décisions d'architecture et je peux expliquer chaque partie. » |
| Comment testez-vous votre back ? | 147 tests automatisés contre une base de test dédiée : droits par rôle, confidentialité des notes, règles métier, sécurité des jetons |
| Comment savez-vous que vos tests détectent de vrais problèmes ? | j'ai cassé le code volontairement de 19 façons (par exemple en montrant les notes privées au patient) : à chaque fois, au moins un test échoue |
| Qu'ont trouvé vos tests ? | deux bugs : la route de santé répondait 404 et un JSON mal formé renvoyait 500 ; les deux sont corrigés |
| Vos tests peuvent-ils effacer la base de démo ? | non : ils utilisent un schéma dédié et refusent de démarrer si son nom ne contient pas « test » |
| Que feriez-vous avec une semaine de plus ? | import Evalandgo, droits par équipe, tests du front, notifications |

## Avant l'oral : liste de contrôle

- [ ] Tout est commité et poussé (front, back, docs).
- [ ] `npm test` vert dans `back/` (sur la base de test), puis `npm run seed` sur la **base de démo**.
- [ ] Le site en ligne affiche la dernière version ; les deux comptes de démo se connectent.
- [ ] `npm run seed` relancé pour repartir de données propres.
- [ ] Heures des séances correctes (18 h 30 pour la prochaine séance de Léa) ; sinon relancer le seed.
- [ ] Lighthouse relancé sur l'adresse en ligne.
- [ ] Le scénario de démonstration répété une fois à voix haute.
- [ ] La réponse à « Avez-vous utilisé une IA ? » préparée.

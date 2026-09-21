# Fonctionnement de l'application

Document de référence : ce que fait le back (routes, données renvoyées), ce que fait le front, toutes les vérifications et contraintes, niveau par niveau, et la façon dont le back est testé.

## 1. Vue d'ensemble

```
Navigateur (React + Vite)  ──HTTPS──►  Express (Node.js)  ──TLS──►  MySQL (Aiven)
   pages praticien / patient            API /api/* + fichiers du front        10 tables

Evalandgo (formulaire) ─ ─ ─ ─ ►  réponses récupérées, stockées en base, affichées
                                   (non connecté dans le prototype : réponses seedées)
```

- **Un seul service** (Render) : Express sert l'API sous `/api` et le front compilé (`front/dist`).
- **Deux rôles** : `praticien` et `patient`. Le rôle est porté par le jeton JWT et contrôlé à chaque requête.
- **Données** : 100 % fictives, créées par le script `back/sql/seed.js`.
- **Tests** : 160 tests automatisés sur le back, contre une base MySQL de test dédiée (voir §8).

---

## 2. Back

### 2.1 Organisation

| Fichier | Rôle |
|---|---|
| `src/index.js` | point d'entrée : charge `.env` puis démarre l'application (`app.listen`) |
| `src/app.js` | l'application Express, sans `listen` : lecture du JSON, route de santé, routes de l'API, service du front, gestion d'erreurs (les tests l'importent) |
| `src/db.js` | pool de connexions MySQL (TLS avec le certificat Aiven, dates en UTC) |
| `src/routes/auth.js` | `POST /api/login`, `GET /api/session` |
| `src/routes/patients.js` | parcours, praticiens, patients, dossier, étapes, séances, notes |
| `src/middlewares/limiteConnexion.js` | limite des échecs de connexion (voir 2.2) |
| `src/middlewares/auth.js` | `authentifier` (vérifie le jeton) et `exigerRole` (vérifie le rôle) |
| `sql/schema.sql` | création des 10 tables et de leurs contraintes |
| `sql/seed.js` | vide les tables puis insère les données de démonstration (exporte `seed()`, aussi utilisée par les tests) |
| `tests/` et `vitest.config.mjs` | tests automatisés du back (voir §8) |

### 2.2 Authentification et droits

1. Le front envoie l'e-mail et le mot de passe à `POST /api/login`.
2. L'API vérifie la limite de tentatives (voir ci-dessous), cherche l'utilisateur (requête paramétrée), compare le mot de passe avec le hash **bcrypt**, puis renvoie un **jeton JWT** (HS256, **8 h**) contenant l'identifiant et le rôle.
3. Le front joint ce jeton à chaque appel : `Authorization: Bearer <jeton>`.
4. Les routes protégées passent par deux garde-fous : `authentifier` (jeton absent ou invalide → **401**) et `exigerRole` (mauvais rôle → **403**).

Le patient ne fournit jamais son identifiant : `GET /api/moi/dossier` utilise celui du jeton, il ne peut donc pas consulter le dossier d'un autre patient.

**Limite de tentatives.** Après 3 échecs de connexion pour un même couple (IP, e-mail), la connexion est bloquée 5 minutes : réponse **429** avec l'en-tête `Retry-After`, même si le mot de passe fourni est correct. Les requêtes invalides (400) ne comptent pas, un e-mail inconnu est traité comme un e-mail connu, et une connexion réussie remet le compteur à zéro. L'état est en mémoire (remis à zéro au redémarrage) ; l'IP est lue derrière le proxy de Render (`trust proxy`).

**Étapes réservées.** Un praticien ne peut démarrer ou terminer que les étapes dont la spécialité attendue est la sienne (kiné : bilan, plan d'action, analyse de foulée ; coordinateur : suivi coordonné). Une étape sans spécialité attendue (questionnaire) est ouverte à tous les praticiens.

### 2.3 Routes de l'API

| Méthode et route | Qui | Entrée | Ce que ça renvoie |
|---|---|---|---|
| `GET /api/health` | public | rien | `{ "status": "ok" }` si la base répond, sinon 500 `{ "status": "db_error" }` |
| `POST /api/login` | public | `{ email, motDePasse }` | `{ token, utilisateur: { id, role, prenom, nom, specialite? } }` (`specialite` : praticien seulement) |
| `GET /api/session` | connecté | rien | `{ id, role, prenom, nom, specialite? }` (restaure la session après un rechargement) |
| `GET /api/parcours` | connecté | rien | liste des parcours avec leurs étapes ordonnées (alimente les filtres) |
| `GET /api/praticiens` | praticien | rien | annuaire : `{ id, prenom, nom, email, specialite }` |
| `GET /api/patients` | praticien | filtres facultatifs `statut`, `etape`, `parcours`, `q` | liste des patients (voir 2.4) |
| `GET /api/patients/:id` | praticien | rien | dossier complet d'un patient (voir 2.4) |
| `GET /api/moi/dossier` | patient | rien | son propre dossier, **notes partagées seulement**, **sans e-mails des praticiens** |
| `PATCH /api/patients/:id/etapes/:idEtape` | praticien (spécialité de l'étape) | `{ statut: "en_cours" ou "realisee" }` | `{ statut }` |
| `POST /api/patients/:id/seances` | praticien | `{ dateHeure, idEtape? }` | 201 `{ id }` |
| `POST /api/patients/:id/notes` | praticien | `{ contenu, visiblePatient? }` | 201 `{ id, contenu, dateCreation, visiblePatient }` |

### 2.4 Ce que renvoient les lectures

**`GET /api/patients`** : un objet par patient
`id, prenom, nom, objectif, idParcours, parcours, etapesRealisees, etapesTotal, idEtapeEnCours, etapeEnCours, prochaineSeance, statut`

- `statut` est calculé par l'API : `a_demarrer` (aucune étape réalisée), `termine` (toutes réalisées), sinon `en_cours`.
- Filtres : `statut` (`a_demarrer`, `en_cours` ou `termine`), `etape` (identifiant de l'étape en cours), `parcours` (identifiant), `q` (recherche sur prénom et nom, 100 caractères maximum).
- Tri : prénom puis nom.

**`GET /api/patients/:id`** et **`GET /api/moi/dossier`** : le même dossier

| Champ | Contenu |
|---|---|
| identité | `id, prenom, nom, email, telephone, sexe, age, objectif, dateCible, idParcours, parcours` |
| `etapes` | pour chaque étape : `idEtape, position, libelle, specialiteAttendue, statut, dateRealisation` |
| `praticiens` | équipe du patient : `id, prenom, nom, specialite` (+ `email` **uniquement côté praticien**) |
| `seancesAVenir` / `seancesPassees` | `id, dateHeure, statut, etape, praticienPrenom, praticienNom, praticienSpecialite` |
| `notes` | `id, contenu, dateCreation, visiblePatient, auteurPrenom, auteurNom, auteurSpecialite` (côté patient : notes partagées seulement) |
| `questionnaire` | `null` si non rempli, sinon `{ dateSoumission, reponses }` où `reponses` réunit toutes les réponses à plat |

### 2.5 Règles métier

**Étapes** (`PATCH .../etapes/:idEtape`), exécutées dans une transaction :
- le praticien doit avoir la spécialité attendue par l'étape (sinon **403**, contrôlé avant la transition) ;
- transitions autorisées : `a_venir` → `en_cours` → `realisee` ; toute autre transition renvoie **409** ;
- **une seule étape en cours** à la fois par patient (sinon 409) ;
- terminer une étape enregistre la date de réalisation et **démarre automatiquement la suivante** ;
- le patient et l'étape doivent être liés (sinon 404).

**Séances** (`POST .../seances`) :
- la date doit être valide et **dans le futur** ;
- le patient doit exister (sinon 404) ;
- l'étape, si elle est fournie, doit appartenir au parcours du patient (sinon 400) ;
- le praticien de la séance est **le praticien connecté** (il ne peut pas en désigner un autre).

**Notes** (`POST .../notes`) :
- contenu de 1 à 2000 caractères après suppression des espaces en début et fin ;
- le patient doit exister (sinon 404) ;
- `visiblePatient` doit être un booléen (faux par défaut) ;
- l'auteur est le praticien connecté et la date est celle du serveur.

### 2.6 Codes d'erreur

| Code | Signification | Exemples de messages |
|---|---|---|
| 400 | requête invalide | `Requête invalide` (dont JSON mal formé), `Identifiant invalide`, `Statut invalide`, `Étape invalide`, `Parcours invalide`, `Recherche invalide`, `Date invalide (elle doit être dans le futur)`, `Étape hors du parcours du patient`, `Note invalide (1 à 2000 caractères)` |
| 401 | non connecté ou jeton invalide | `Non authentifié`, `Session invalide ou expirée`, `Session invalide`, `Identifiants invalides` |
| 403 | droits insuffisants | `Accès refusé`, `Cette étape est réservée : <spécialité>` |
| 404 | introuvable | `Patient introuvable`, `Dossier introuvable`, `Étape introuvable pour ce patient`, `Page introuvable` (route `/api/...` inconnue) |
| 409 | conflit avec une règle métier | `Transition impossible : ...`, `Une autre étape est déjà en cours` |
| 429 | trop d'échecs de connexion | `Trop de tentatives échouées. Réessayez dans N minute(s).` |
| 500 | erreur serveur | `Erreur serveur` (le détail reste dans les logs) |

Toutes les erreurs de l'API sont renvoyées en JSON sous la forme `{ "erreur": "..." }` (seule exception : `/api/health`, qui renvoie `{ "status": ... }`).

### 2.7 Serveur

- **Fichiers du front** : servis depuis `front/dist` par `express.static`.
- **Dates en UTC** : le pool MySQL travaille en UTC, l'API renvoie des dates ISO et le navigateur les affiche à l'heure locale.
- **Toute route `/api/...` inconnue** renvoie du JSON ; le reste renvoie la page du front (nécessaire au routage côté navigateur).
- **Route de santé** : `GET /api/health` est déclarée **avant** le 404 JSON de `/api`, sinon elle serait masquée.
- **JSON mal formé** dans une requête : réponse 400 (et non 500).

---

## 3. Base de données

| Table | Contenu |
|---|---|
| `utilisateur` | comptes : e-mail, hash du mot de passe, rôle, prénom, nom |
| `patient` / `praticien` | spécialisations de `utilisateur` (téléphone, sexe, âge, objectif / spécialité) |
| `parcours` / `etape` | le parcours et ses étapes ordonnées |
| `avancement` | une ligne par patient et par étape : statut et date de réalisation |
| `patient_praticien` | praticiens impliqués auprès d'un patient |
| `seance` | rendez-vous : patient, praticien, étape, date, statut |
| `note_suivi` | notes de suivi : auteur, contenu, visibilité patient |
| `questionnaire` | réponses : infos clés en colonnes typées, le reste en JSON (`autres_reponses`) |

Le questionnaire garde en colonnes ce qui est affiché en évidence ou filtré (objectif, douleurs, alertes cardio, poids, taille…). Le reste est en JSON, car il n'est ni filtré ni requêté.

---

## 4. Vérifications et contraintes

Chaque règle est contrôlée à plusieurs niveaux : le navigateur guide l'utilisateur, **l'API fait foi**, la base est le dernier filet.

### 4.1 Navigateur (confort, pas sécurité)

| Où | Vérification |
|---|---|
| Connexion | champs obligatoires, e-mail au bon format |
| Note | texte obligatoire, 2000 caractères maximum, bouton désactivé si vide |
| Séance | date et heure obligatoires |
| Étapes | boutons affichés seulement si la transition est possible (pas de « Démarrer » si une étape est déjà en cours) |
| Général | boutons désactivés pendant un envoi, messages d'erreur annoncés aux lecteurs d'écran |

### 4.2 API (fait foi)

| Sujet | Contrôle |
|---|---|
| Connexion | e-mail et mot de passe de type texte ; e-mail de 254 caractères maximum ; mot de passe de 72 caractères maximum (limite de bcrypt) |
| Connexion | même message d'erreur que l'e-mail existe ou non, et comparaison factice si l'e-mail est inconnu (pas de fuite sur les comptes existants) |
| Jeton | signature vérifiée, algorithme HS256 imposé, expiration 8 h |
| Droits | rôle contrôlé sur chaque route ; identifiant du patient lu dans le jeton pour `/api/moi/dossier` |
| Identifiants | `:id` et `:idEtape` doivent être des entiers positifs (sinon 400) |
| Filtres | `statut` parmi trois valeurs, `etape` et `parcours` entiers, `q` en texte de 100 caractères maximum |
| Recherche | caractères spéciaux (`%`, `_`, `\`) neutralisés, aucune concaténation SQL |
| SQL | **toutes les requêtes sont paramétrées** |
| Notes, séances | règles du paragraphe 2.5 |
| Confidentialité | notes privées et e-mails des praticiens jamais envoyés au patient (filtrés par l'API, pas seulement masqués à l'écran) |

### 4.3 Base de données (dernier filet)

| Type | Contraintes |
|---|---|
| Unicité | e-mail des utilisateurs ; nom d'un parcours ; position d'une étape dans un parcours ; un seul questionnaire par patient |
| Clés étrangères | toutes les relations ; suppression d'un patient en cascade (avancement, séances, notes, questionnaire) |
| Valeurs autorisées (ENUM) | rôle, sexe, statuts, réponses à choix unique du questionnaire |
| `CHECK` | âge de 14 à 99 ans ; étape réalisée = date de réalisation obligatoire ; consentement RGPD obligatoire ; poids 20 à 300 kg ; taille 100 à 250 cm ; volume ≤ 100 km ; `autres_reponses` doit être un objet JSON |
| `NOT NULL` | toutes les questions obligatoires du formulaire |

### 4.4 Sécurité transverse

- Mots de passe **hachés** (bcrypt), jamais stockés ni renvoyés.
- Connexion à la base **chiffrée** (TLS) avec le certificat du fournisseur.
- Secrets (`JWT_SECRET`, identifiants de base) dans des **variables d'environnement**, jamais dans le dépôt.
- Contrôles de rôle, confidentialité des notes et protection contre l'injection SQL **vérifiés par des tests automatisés** (voir §8).

---

## 5. Front

### 5.1 Organisation (`front/src/`)

| Dossier ou fichier | Rôle |
|---|---|
| `main.jsx` | point d'entrée : polices, thème, routeur, session |
| `App.jsx` | table des routes |
| `api.js` | appels à l'API : ajoute le jeton, gère les erreurs, signale une session expirée |
| `auth/` | `AuthContext.jsx` (fournisseur : connexion, déconnexion, restauration de session), `useAuth.js`, `contexte.js` |
| `theme.js` | les trois thèmes et leur mémorisation |
| `formulaire.js` | libellés des questions et de leurs options, infos clés, points d'attention |
| `tools/` | `dateFormat.js` (dates en français), `statuts.js` (libellés de statut) |
| `pdf/questionnairePdf.js` | génération du PDF du questionnaire |
| `components/` | briques de mise en page : `Bande`, `Carte`, `Pastille`, `Tuile`, `Statuts`, `Layout`, `RouteProtegee`, `Chargement`, `AnnuairePraticiens`, `SelecteurTheme` |
| `components/fiche/` | blocs du dossier : `EtapesParcours`, `NotesSuivi`, `Seances`, `InfosFormulaire` |
| `pages/` | `Connexion`, `Accueil`, `praticien/ListePatients`, `praticien/FichePatient`, `patient/MonParcours` |

### 5.2 Routes

| Adresse | Écran | Accès |
|---|---|---|
| `/connexion` | connexion, avec deux boutons de démonstration | public |
| `/` | redirige selon le rôle | connecté |
| `/praticien` | liste des patients, filtres, annuaire | praticien |
| `/praticien/patients/:id` | fiche patient | praticien |
| `/patient` | « Mon parcours » | patient |
| toute autre adresse | retour à `/` | |

`RouteProtegee` redirige vers la connexion si personne n'est connecté, et vers `/` si le rôle ne convient pas. Ces gardes sont un confort : la vraie protection est celle de l'API.

### 5.3 Session

- Le jeton est conservé dans le `localStorage`.
- Au chargement, si un jeton existe, le front appelle `GET /api/session` pour retrouver l'utilisateur. Pendant ce temps, un écran de chargement s'affiche (logo qui pulse ; après 4 s, un message indique que le serveur se réveille).
- Toute réponse **401** de l'API efface le jeton et renvoie à la connexion.

### 5.4 Ce que fait chaque écran

**Liste des patients** : quatre tuiles de chiffres qui servent aussi de filtres, recherche, filtres statut et étape, tableau (statut, progression, prochaine séance). **Chaque ligne est cliquable** : le nom est un vrai lien étendu à toute la ligne, donc le clic, le clic milieu (nouvel onglet) et le clavier fonctionnent. Un bouton « Ouvrir → » et une phrase d'aide l'indiquent. Sous 768 px, le tableau devient une liste de cartes. Un annuaire de tous les praticiens, avec leur e-mail, est affiché en bas.

**Fiche patient** : identité et objectif, étapes (boutons Démarrer et Terminer, limités aux étapes de la spécialité du praticien connecté), notes (avec la case « visible par le patient »), séances (planification), praticiens impliqués avec leur e-mail, questionnaire (infos clés, points d'attention, toutes les réponses, téléchargement PDF).

**Mon parcours (patient)** : progression, prochaine séance, étapes en lecture seule, messages partagés par les praticiens, équipe (sans e-mails), séances, questionnaire ou bouton vers Evalandgo s'il n'est pas rempli, téléchargement PDF.

### 5.5 Questionnaire et PDF

- `formulaire.js` traduit les codes stockés en base (`aggrave_en_courant`) en libellés lisibles. C'est l'unique endroit où les questions sont décrites côté front.
- **Points d'attention** (praticien seulement) : douleur thoracique à l'effort, malaise, palpitations, douleur qui empêche de courir, arrêt de plus de deux semaines. Ce choix est une proposition à valider avec l'équipe médicale.
- **PDF** : généré dans le navigateur avec jsPDF, chargé **uniquement au clic** (il n'alourdit pas le chargement de la page). Le PDF reprend les couleurs de la marque, et sa version « praticien » inclut les points d'attention, pas celle du patient.

### 5.6 Design et accessibilité

- **Trois thèmes** : PrépaMarathon (par défaut, palette du site), Clair, Sombre. Le choix est mémorisé.
- **Trois polices** : Oswald (titres), Libre Baskerville (textes rédigés), Verdana (interface). Oswald et Libre Baskerville sont hébergées avec l'application.
- **Mise en page** : bandes pleine largeur, cartes à contour et ombre décalée, pastilles, tuiles inclinées, étapes en cartes numérotées (1 à 5 colonnes selon la largeur).
- **Icônes** (lucide-react) : statuts, badges de séance et de notes (privée en orange, partagée en vert), tuiles, progression. Toujours accompagnées d'un libellé.
- **Mouvement** : écran de chargement, animation d'entrée des pages, apparition des sections au défilement. Tout est désactivé si le système demande moins de mouvement.
- **Accessibilité** : statuts jamais portés par la couleur seule, contrastes vérifiés, focus clavier visible, lien « Aller au contenu », labels sur tous les champs, messages annoncés (`aria-live`), animations désactivées si le système le demande.

---

## 6. Données de démonstration

Le script `npm run seed` (dans `back/`) **vide toutes les tables** puis crée 5 praticiens, 8 patients à des stades différents, leurs séances, leurs notes (certaines privées) et 7 questionnaires. Un patient n'a pas de questionnaire, pour montrer le bouton vers Evalandgo.

Mot de passe de tous les comptes de démonstration : `Demo1234!`.

| Rôle | Comptes |
|---|---|
| Praticiens | `sam.lefevre@example.com` (kiné), `alex.garnier@example.com` (coordinateur), `camille.renaud@example.com`, `noa.bertrand@example.com`, `ines.moreau@example.com` |
| Patients | `lea.martin`, `karim.benali`, `sophie.lambert`, `thomas.girard`, `chloe.petit`, `hugo.roux`, `emma.faure`, `nathan.blanc` (tous en `@example.com`) |

## 7. Déploiement

Un service Web Render relié au dépôt GitHub : il compile le front, installe le back et lance Express. La base MySQL est hébergée chez Aiven. Variables d'environnement : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, et `PORT` (fourni par Render).

## 8. Tests automatisés (back)

Vitest et Supertest, lancés avec `npm test` dans `back/`. Les tests appellent l'application Express sans démarrer de serveur et interrogent une vraie base MySQL. **160 tests, 7 fichiers**, exécutés l'un après l'autre.

| Fichier | Tests | Ce qui est vérifié |
|---|---|---|
| `auth.test.js` | 30 | santé de l'API, connexion (identifiants, entrées invalides, injection), jeton (autre secret, expiré, autre algorithme, `alg: none`), spécialité du profil |
| `limiteConnexion.test.js` | 9 | 3 échecs puis 429, `Retry-After`, comptes et IP indépendants, e-mail inconnu, remise à zéro, levée du blocage après 5 minutes |
| `droits.test.js` | 10 | 401 sans jeton, 403 pour le mauvais rôle sur chaque route, un refus n'a aucun effet |
| `confidentialite.test.js` | 10 | le patient ne voit ni les notes privées ni les e-mails des praticiens, uniquement son dossier |
| `patients.test.js` | 46 | liste, filtres, recherche (jokers SQL, injection), dossier, types, cohérence des étapes |
| `etapes.test.js` | 20 | transitions, une seule étape en cours, démarrage automatique de la suivante, étapes réservées à une spécialité |
| `ecritures.test.js` | 35 | séances et notes : validation, auteur = utilisateur connecté, heures stockées en UTC |

- **Base de test** : schéma séparé (`via_sana_test`), nom lu dans `back/.env.test` (`DB_NAME`, `JWT_SECRET` ; hôte et identifiants repris de `.env`). Le seed, qui vide toutes les tables, est rejoué avant chaque exécution.
- **Garde-fou** : les tests refusent de démarrer si `DB_NAME` ne contient pas « test ».
- **Efficacité** : 27 régressions injectées volontairement (droits, confidentialité, transitions, UTC, limite de connexion, restriction par spécialité…) sont toutes détectées par au moins un test.
- **Hors périmètre** : le front (aucun test automatisé), les contraintes de la base (vérifiées indirectement), la charge.

## 9. Limites connues

- Le formulaire n'est pas saisi dans l'application : les réponses sont seedées (le vrai flux passerait par Evalandgo).
- Un praticien peut consulter et annoter n'importe quel patient (pas de droits par équipe) ; seules les étapes sont limitées à sa spécialité.
- Limite de connexion en mémoire (remise à zéro au redémarrage, non partagée entre instances) ; jeton stocké dans le navigateur.
- En-têtes de sécurité HTTP (CSP, HSTS…) non configurés côté Express : à ajouter en production.
- Coordonnées des praticiens : e-mail uniquement (pas de téléphone en base).
- Tests automatisés sur le back uniquement : le front n'en a pas.
- Hébergement de données de santé : un fournisseur certifié HDS est nécessaire en production.

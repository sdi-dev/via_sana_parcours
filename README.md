# Via Sana : suivi de parcours « Préparation Marathon »

**Contexte:** Prototype réalisé pour le case « Product Builder / Dev » de Via Sana. <br>
**Dates:** 19-21/09/2026 | **Auteur:** [Yanis Saoudi](mailto:yanis.saoudi@efrei.net)

------
Un **praticien** suit l'avancement d'un coureur dans son parcours de soins ; le **patient** consulte le sien.

Les données sont **100 % fictives**. Ce n'est pas un logiciel médical.

## Ce que fait l'application

| Interface praticien | Interface patient |
|---|---|
| liste des patients, filtrable par statut, étape et parcours, avec recherche | progression dans le parcours |
| fiche patient : identité, questionnaire préalable, points d'attention | prochaine séance, séances passées |
| étapes réalisées, en cours et à venir (le praticien les fait avancer) | étapes réalisées et à venir |
| notes de suivi, privées ou partagées avec le patient | notes partagées par les praticiens |
| planification de séances | questionnaire, ou bouton vers Evalandgo s'il n'est pas rempli |
| annuaire des praticiens avec leur e-mail | équipe de soins (sans e-mails) |
| questionnaire téléchargeable en PDF | questionnaire téléchargeable en PDF |

L'interface reprend le langage visuel de prepamarathon.com, avec trois thèmes (PrépaMarathon, clair, sombre).

## Stack

| Couche | Choix |
|---|---|
| Front | React 19, Vite, Tailwind 4, daisyUI 5, React Router 7 (mode déclaratif) |
| Back | Node.js, Express 5, bcrypt, JWT |
| Base | MySQL 8 hébergée chez Aiven, connexion TLS |
| Tests | Vitest et Supertest (back) |
| Hébergement | un seul service Render : Express sert l'API sous `/api` et le front compilé |

## Structure du dépôt

```
via_sana_parcours/
├── front/                  application React (Vite)
├── back/
│   ├── src/
│   │   ├── index.js        point d'entrée : charge .env et lance l'application
│   │   ├── app.js          application Express (routes, erreurs, service du front)
│   │   ├── db.js           pool MySQL (TLS, dates en UTC)
│   │   ├── routes/         auth.js, patients.js
│   │   └── middlewares/    auth.js (jeton et rôle)
│   ├── sql/                schema.sql, seed.js
│   ├── certs/ca.pem        certificat de la base Aiven
│   └── tests/              tests automatisés
└── docs/                   documentation détaillée
```

## Lancer en local

### Prérequis

- Node.js récent (le projet est développé avec Node 24).
- Une base MySQL 8 **accessible en TLS**. Le back est configuré pour Aiven : le certificat est lu dans `back/certs/ca.pem`, et `db.js` exige une connexion chiffrée.

### 1. Base de données

Exécute `back/sql/schema.sql` sur un schéma vide (10 tables).

### 2. Back

Copie `back/.env.example` en `back/.env` et renseigne les variables :

| Variable | Rôle |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | connexion à la base |
| `JWT_SECRET` | secret de signature des jetons (chaîne longue et aléatoire) |
| `PORT` | port d'écoute (3000 par défaut ; fourni par Render en ligne) |

Puis, dans `back/` :

```
npm install
npm run seed
npm run dev
```

> ⚠️ `npm run seed` **vide toutes les tables** du schéma visé avant de les remplir. À relancer avant une démonstration pour repartir de données propres.

### 3. Front

Dans `front/` :

```
npm install
npm run dev
```

Le serveur de développement Vite redirige `/api` vers `http://localhost:3000` : lance donc le back d'abord. Ouvre l'adresse affichée par Vite.

### Comme en ligne (un seul service)

Compile le front (`npm run build` dans `front/`), puis lance `npm start` dans `back/` : Express sert l'API et `front/dist`.

## Comptes de démonstration

Mot de passe de tous les comptes : `Demo1234!`. La page de connexion propose aussi deux boutons « Démo praticien » et « Démo patient ».

| Rôle | Comptes (tous en `@example.com`) |
|---|---|
| Praticiens | `sam.lefevre` (kiné, utilisé pour la démo), `alex.garnier` (coordinateur), `camille.renaud` (médecin), `noa.bertrand` (ostéopathe), `ines.moreau` (diététicien) |
| Patients | `lea.martin`, `karim.benali`, `sophie.lambert`, `thomas.girard`, `chloe.petit`, `hugo.roux`, `emma.faure`, `nathan.blanc` |

Les patients sont à des stades différents, pour montrer les cas :
- `sophie.lambert` : **pas de questionnaire**, donc le bouton vers Evalandgo ;
- `hugo.roux` et `nathan.blanc` : réponses qui déclenchent des **points d'attention** ;
- `emma.faure` : **parcours terminé**.

## Tests

147 tests automatisés vérifient le back : droits par rôle, confidentialité des notes, règles métier, sécurité des jetons, filtres et recherche.

Ils utilisent un **schéma séparé** : ils commencent par rejouer le seed, qui vide toutes les tables. Ils **refusent de démarrer** si le nom de la base ne contient pas « test ».

1. Crée un schéma `via_sana_test` sur la même instance, et exécute-y `back/sql/schema.sql`.
2. Copie `back/.env.test.example` en `back/.env.test` (il ne doit pas être commité). Il contient `DB_NAME` et `JWT_SECRET` ; l'hôte et les identifiants sont repris de `.env`.
3. Dans `back/` :

```
npm test
```

Le détail des tests est dans [`docs/fonctionnement.md`](docs/fonctionnement.md) (§8).

## Déploiement

Un service Web Render relié au dépôt : il compile le front, installe le back et lance Express. La base MySQL est hébergée chez Aiven. Variables d'environnement : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.

Le plan gratuit met le service en veille : le premier accès prend environ une minute.

## Hypothèses de périmètre

Les questions de cadrage n'ont pas reçu de réponse dans le temps imparti : ces choix sont des hypothèses, faciles à changer.

| Point ouvert | Choix retenu |
|---|---|
| Le patient réserve-t-il ses séances ? | non, il les consulte |
| Qui crée les patients ? | pas d'inscription publique : données de démonstration |
| Les notes sont-elles visibles du patient ? | seulement celles que le praticien partage |
| Le coordinateur de soins | un praticien avec cette spécialité |
| Le formulaire | la saisie reste chez Evalandgo ; l'application stocke et affiche les réponses |

## Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Back | Node.js et Express | un seul langage front et back, mise en place légère |
| Base | MySQL | données fortement relationnelles ; JSON seulement pour les réponses secondaires du questionnaire |
| Comptes | table `utilisateur` commune, spécialisée en `patient` et `praticien` | un seul système de connexion |
| Authentification | bcrypt et JWT de 8 h, joint dans l'en-tête `Authorization` | simple, sans état côté serveur |
| Dates | stockées et transmises en UTC, affichées à l'heure locale | évite les décalages entre poste local et serveur |
| Contrôles | le navigateur guide, **l'API fait foi**, la base garantit | une donnée invalide ne doit pas entrer par une autre porte |

## Limites connues

- Les réponses du formulaire sont **seedées** : pas de connexion réelle à Evalandgo.
- Tout praticien peut modifier tout patient (pas de droits par équipe).
- Pas de limitation des tentatives de connexion ; le jeton est stocké dans le navigateur.
- En-têtes de sécurité HTTP non configurés côté Express.
- Tests automatisés sur le back uniquement.
- Des données de santé réelles exigeraient un hébergement certifié **HDS**.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/cheminement.md`](docs/cheminement.md) | démarche, choix, support de l'oral |
| [`docs/fonctionnement.md`](docs/fonctionnement.md) | routes, règles métier, contraintes, tests |
| [`docs/RAPPORT-QUALITE.md`](docs/RAPPORT-QUALITE.md) | responsive, accessibilité, performance |

# Via Sana : suivi de parcours « Préparation Marathon »

**Contexte:** Prototype réalisé pour le case « Product Builder / Dev » de Via Sana. <br>
**Dates:** 19-21/09/2026 | **Auteur:** [Yanis Saoudi](mailto:yanis.saoudi@efrei.net)

------

**Principe:** un **praticien** suit l'avancement d'un coureur dans son parcours de soins, le **patient** consulte le sien. Toutes les données sont fictives.

## Fonctionnalités

- **Praticien** : liste des patients (filtres, recherche), fiche patient (étapes, séances, notes, questionnaire préalable en PDF), annuaire des praticiens. Chacun n'agit que sur les étapes de sa spécialité.
- **Patient** : progression dans le parcours, prochaines séances, notes partagées par les praticiens, questionnaire.
- Trois thèmes (PrépaMarathon, clair, sombre), interface responsive et accessible.

## Stack

React 19, Vite, Tailwind 4, daisyUI 5, React Router 7 · Node.js, Express 5 · MySQL 8 (Aiven, TLS) · Vitest et Supertest · Render.

## Installation

**Prérequis** : Node.js récent et une base MySQL 8 accessible en TLS (certificat dans `back/certs/ca.pem`).

1. Exécuter `back/sql/schema.sql` sur un schéma vide.
2. Copier `back/.env.example` en `back/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT`).
3. Back, dans `back/` :
   ```
   npm install
   npm run seed
   npm run dev
   ```
   `npm run seed` **vide toutes les tables** avant de les remplir.
4. Front, dans `front/` :
   ```
   npm install
   npm run dev
   ```
   Le back doit tourner sur le port 3000 : Vite y redirige `/api`.

En production, `npm run build` dans `front/` puis `npm start` dans `back/` : Express sert l'API et `front/dist`.

## Comptes de démonstration

Mot de passe : `Demo1234!` (page de connexion : boutons « Démo praticien » et « Démo patient »).

| Rôle | Comptes (`@example.com`) |
|---|---|
| Praticiens | `sam.lefevre` (kiné), `alex.garnier` (coordinateur), `camille.renaud` (médecin), `noa.bertrand` (ostéopathe), `ines.moreau` (diététicien) |
| Patients | `lea.martin`, `karim.benali`, `sophie.lambert` (sans questionnaire), `thomas.girard`, `chloe.petit`, `hugo.roux` (points d'attention), `emma.faure` (parcours terminé), `nathan.blanc` |

Après 3 mots de passe erronés pour un compte, la connexion est bloquée 5 minutes.

## Tests

160 tests sur le back, sur un schéma dédié (le seed vide toutes les tables) :

1. Créer un schéma `via_sana_test` et y exécuter `back/sql/schema.sql`.
2. Copier `back/.env.test.example` en `back/.env.test` (non versionné).
3. Dans `back/` : `npm test`.

Les tests refusent de démarrer si le nom de la base ne contient pas « test ».

## Déploiement

Service Web Render relié au dépôt (compile le front, installe le back, lance Express), base MySQL chez Aiven. Variables : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`. Le plan gratuit met le service en veille : le premier accès prend environ une minute.

## Limites

Réponses du formulaire seedées (pas d'import Evalandgo) · pas de droits par équipe · jeton stocké dans le navigateur · en-têtes de sécurité HTTP non configurés · hébergement HDS requis pour des données réelles.

## Documentation

- [`docs/cheminement.md`](docs/cheminement.md) : démarche, hypothèses, choix de conception
- [`docs/fonctionnement.md`](docs/fonctionnement.md) : routes, règles métier, contraintes, tests
- [`docs/RAPPORT-QUALITE.md`](docs/RAPPORT-QUALITE.md) : accessibilité, responsive, performance

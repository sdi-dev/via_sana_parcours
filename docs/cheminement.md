# Démarche et choix de conception

## Contexte

Prototype de suivi patient pour le parcours « Préparation Marathon » de Via Sana : une interface **praticien** (liste filtrable, fiche patient, étapes, séances, notes, questionnaire) et une interface **patient** simplifiée. Le brief demande surtout une structure claire des données, des flux et des rôles ; ce n'est pas un logiciel médical complet.

## Périmètre et hypothèses

Les questions de cadrage n'ont pas reçu de réponse dans le temps imparti. Chaque hypothèse est assumée et modifiable.

| Point ouvert | Choix retenu |
|---|---|
| Réservation des séances | le patient les consulte, sans les réserver |
| Création des patients | pas d'inscription publique : données de démonstration |
| Visibilité des notes | le patient ne voit que les notes marquées comme partagées |
| Coordinateur de soins | un praticien de spécialité « coordinateur de soins » |
| Droits d'édition des étapes | un praticien n'agit que sur les étapes de sa spécialité |
| Formulaire préalable | la saisie reste chez Evalandgo ; l'application stocke et affiche les réponses |

## Analyse du terrain

Le site PrépaMarathon et le formulaire Evalandgo (17 écrans, une quarantaine de questions, consentement RGPD) ont servi de base au modèle de données et au jeu de démonstration. Le parcours compte 5 étapes : questionnaire, bilan kiné, plan d'action, analyse de foulée (facultative), suivi coordonné. La politique de confidentialité annonce un hébergement HDS.

## Choix techniques

| Couche | Choix | Raison |
|---|---|---|
| Front | React, Vite, Tailwind, daisyUI, React Router | stack maîtrisée, thèmes simples à décliner |
| Back | Node.js, Express | un seul langage, mise en place légère pour un prototype |
| Base | MySQL | données fortement relationnelles (jointures, filtres) ; JSON limité aux réponses secondaires du questionnaire |
| Hébergement | Render et Aiven, un seul service | déploiement continu ; Express sert aussi le front |
| Dépôt | monorepo `front/` et `back/` | un seul endroit |

## Modèle de données

10 tables : `utilisateur` (connexion, rôle) spécialisée en `patient` et `praticien` ; `parcours`, `etape` et `avancement` (une ligne par patient et par étape) ; `seance`, `note_suivi`, `patient_praticien` ; `questionnaire`.

- Comptes : table commune et deux tables de profil, pour un seul système de connexion.
- Questionnaire : colonnes typées pour ce qui est affiché ou filtré, JSON pour le reste ; choix multiples en `SET`.
- Contraintes (`CHECK`, `UNIQUE`, clés étrangères) dans la base : une donnée invalide ne peut pas entrer par une autre porte.

## Formulaire

Flux cible : le patient remplit le formulaire chez Evalandgo, l'application récupère les réponses, les stocke et les affiche. Le prototype remplace la récupération par un seed ; un patient sans questionnaire voit un bouton vers Evalandgo. L'import automatique est la première évolution.

## Droits, règles métier, sécurité

Principe : le navigateur guide, l'API décide, la base garantit.

- **Authentification** : mot de passe haché (bcrypt), jeton JWT de 8 h (identifiant et rôle), message d'erreur identique que le compte existe ou non.
- **Limite de tentatives** : 3 échecs par couple (IP, e-mail), puis blocage de 5 minutes.
- **Droits** : rôle contrôlé sur chaque route ; le patient lit son dossier via son jeton. Un praticien n'agit que sur les étapes de sa spécialité.
- **Confidentialité** : notes privées et e-mails des praticiens filtrés côté API.
- **Règles métier** : `à venir` → `en cours` → `réalisée`, une seule étape en cours, terminer une étape démarre la suivante, séance obligatoirement dans le futur.
- **Injection SQL** : requêtes paramétrées, jokers de recherche neutralisés.

## Front

- La vue patient réutilise les composants de la fiche praticien en lecture seule.
- Session : jeton en `localStorage`, restaurée au rechargement, effacée sur réponse 401.
- Un bloc « points d'attention » signale certaines réponses du questionnaire (proposition à valider avec l'équipe médicale).
- Le questionnaire est téléchargeable en PDF, généré dans le navigateur et chargé au clic.
- Design repris du site PrépaMarathon : bandes pleine largeur, cartes à contour, pastilles, trois thèmes, icônes lucide, animations désactivées si le système demande moins de mouvement. L'orange de la marque est réservé aux fonds ; une teinte plus foncée sert au texte, pour respecter le contraste.

## Qualité

- **Tests** : 160 tests automatisés sur le back (droits, confidentialité, règles métier, jetons, limite de connexion), contre une base de test dédiée protégée par un garde-fou.
- **Accessibilité et performance** : audit axe et Lighthouse, résultats dans [`RAPPORT-QUALITE.md`](RAPPORT-QUALITE.md).
- Détail des routes, règles et tests : [`fonctionnement.md`](fonctionnement.md).

## Difficultés et arbitrages

- **Dates** : heures de séance décalées entre poste local et serveur. Tout est stocké et transmis en UTC, affiché à l'heure locale ; deux tests figent cette convention.
- **Déploiement** : un premier déploiement a échoué (dépendances du back et certificat de la base non commités), ce que le déploiement précoce d'un squelette a permis de détecter.
- **Marque et accessibilité** : voir le paragraphe Front.
- **Bugs révélés par les tests** : route de santé masquée par le 404 JSON, JSON mal formé renvoyant 500 au lieu de 400. Corrigés.
- **Périmètre** : aucune fonctionnalité hors brief ; le temps a été investi dans la qualité de l'existant.

## Limites

- Réponses du formulaire seedées : pas de connexion à Evalandgo.
- Pas de droits par équipe : un praticien peut consulter et annoter tout patient.
- Limite de connexion en mémoire (remise à zéro au redémarrage) ; jeton stocké dans le navigateur.
- En-têtes de sécurité HTTP non configurés côté Express.
- Aucun test automatisé côté front.
- Données de santé réelles : hébergement certifié HDS obligatoire.

## Perspectives

1. Import automatique des réponses Evalandgo (export, API ou webhook), éventuellement via n8n.
2. Droits par équipe.
3. Notifications et rappels de séances ; réservation par le patient.
4. Cookies `httpOnly`, en-têtes de sécurité HTTP, limite de connexion partagée entre instances.
5. Tests du front et de bout en bout.

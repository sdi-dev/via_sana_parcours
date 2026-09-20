// Charge l'environnement des tests et REFUSE de continuer si la base visée n'est pas une base de test.
const path = require('path');
const dotenv = require('dotenv');

const racine = path.join(__dirname, '..');
// dotenv n'écrase jamais une variable déjà définie : ..env.test gagne, .env fournit le reste (hôte, identifiants)
dotenv.config({ path: path.join(racine, '.env.test'), quiet: true });
dotenv.config({ path: path.join(racine, '.env'), quiet: true });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwtSecret4testingONLY';

if (!/test/i.test(process.env.DB_NAME || '')) {
  throw new Error(
    `Tests refusés : DB_NAME="${process.env.DB_NAME || ''}" ne contient pas « test ». ` +
    'Le seed vide toutes les tables : crée un schéma dédié et indique-le dans ..env.test (voir ...env.test.example).'
  );
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Exécuté une fois avant tous les fichiers de tests : garde-fou, puis seed de la base de test.
export async function setup() {
  require('./chargerEnv.js');
  const { seed } = require('../sql/seed.js');
  await seed();
  await require('../src/db.js').end();
}

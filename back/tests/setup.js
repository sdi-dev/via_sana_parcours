// Exécuté dans chaque fichier de tests, avant l'import de l'application.
require('./chargerEnv.js');

// Ferme le pool MySQL à la fin de chaque fichier pour ne pas laisser de connexions ouvertes
afterAll(async () => {
  await require('../src/db').end();
});

// Chaque test repart sans échec de connexion enregistré
beforeEach(() => {
  require('../src/middlewares/limiteConnexion').reinitialiser();
});

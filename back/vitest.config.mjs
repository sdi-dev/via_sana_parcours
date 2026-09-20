import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/globalSetup.mjs'], // remplit la base de test une fois, avant tous les fichiers
    setupFiles: ['tests/setup.js'],         // charge l'environnement de test, ferme le pool en fin de fichier
    fileParallelism: false,                 // une seule base partagée : les fichiers passent l'un après l'autre
    testTimeout: 30_000,
    hookTimeout: 120_000,                   // le seed est plus lent contre une base distante (Aiven)
  },
});

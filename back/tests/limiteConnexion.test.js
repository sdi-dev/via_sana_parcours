const { api, PRATICIEN, PATIENT, MOT_DE_PASSE } = require('./aide');
const { DUREE_MS } = require('../src/middlewares/limiteConnexion');

// Le corps de la requête et l'IP (via X-Forwarded-For, lu grâce à « trust proxy ») sont paramétrables
const essai = (email, motDePasse, ip = '10.0.0.1') =>
  api().post('/api/login').set('X-Forwarded-For', ip).send({ email, motDePasse });
const echecs = async (n, email = PRATICIEN, ip) => {
  for (let i = 0; i < n; i++) expect((await essai(email, 'mauvais', ip)).status).toBe(401);
};

afterEach(() => vi.useRealTimers());

describe('Limite des tentatives de connexion (3 échecs, blocage de 5 minutes)', () => {
  it('bloque au 4e essai (429), avec Retry-After et un message en minutes', async () => {
    await echecs(3);
    const r = await essai(PRATICIEN, 'mauvais');
    expect(r.status).toBe(429);
    expect(Number(r.headers['retry-after'])).toBeGreaterThan(295);
    expect(Number(r.headers['retry-after'])).toBeLessThanOrEqual(300);
    expect(r.body.erreur).toBe('Trop de tentatives échouées. Réessayez dans 5 minutes.');
  });

  it('reste bloqué même avec le bon mot de passe', async () => {
    await echecs(3);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(429);
  });

  it('ne bloque pas un autre compte depuis la même IP, ni le même compte depuis une autre IP', async () => {
    await echecs(3);
    expect((await essai(PATIENT, MOT_DE_PASSE)).status).toBe(200);
    expect((await essai(PRATICIEN, MOT_DE_PASSE, '10.0.0.2')).status).toBe(200);
  });

  it('traite un e-mail inconnu comme un e-mail connu (aucune fuite sur les comptes)', async () => {
    await echecs(3, 'personne@example.com');
    expect((await essai('personne@example.com', 'mauvais')).status).toBe(429);
  });

  it('ignore la casse et les espaces autour de l’e-mail', async () => {
    await essai(PRATICIEN, 'mauvais');
    await essai(PRATICIEN.toUpperCase(), 'mauvais');
    await essai(`  ${PRATICIEN} `, 'mauvais');
    expect((await essai(PRATICIEN, 'mauvais')).status).toBe(429);
  });

  it('une connexion réussie remet le compteur à zéro', async () => {
    await echecs(2);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(200);
    await echecs(2);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(200);
  });

  it('les requêtes invalides (400) ne comptent pas comme des échecs', async () => {
    for (let i = 0; i < 5; i++) expect((await essai(PRATICIEN, 'a'.repeat(73))).status).toBe(400);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(200);
  });

  it('le blocage est levé au bout de 5 minutes', async () => {
    await echecs(3);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(429);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + DUREE_MS + 1000);
    expect((await essai(PRATICIEN, MOT_DE_PASSE)).status).toBe(200);
  });

  it('après le blocage, le compteur repart de zéro (3 nouveaux échecs avant un nouveau blocage)', async () => {
    await echecs(3);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + DUREE_MS + 1000);
    await echecs(3);
    expect((await essai(PRATICIEN, 'mauvais')).status).toBe(429);
  });
});

const jwt = require('jsonwebtoken');
const { api, bearer, connexion, jeton, MOT_DE_PASSE, PRATICIEN, PATIENT } = require('./aide');

describe('Santé de l’API', () => {
  it('GET /api/health répond ok quand la base est joignable', async () => {
    const r = await api().get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: 'ok' });
  });

  it('une route /api inconnue renvoie un 404 JSON', async () => {
    const r = await api().get('/api/nexiste-pas');
    expect(r.status).toBe(404);
    expect(r.body).toHaveProperty('erreur');
  });
});

describe('POST /api/login', () => {
  it('connecte un praticien et renvoie un jeton + son profil', async () => {
    const r = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: MOT_DE_PASSE });
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe('string');
    expect(r.body.utilisateur).toMatchObject({ role: 'praticien', prenom: 'Sam', nom: 'Lefèvre' });
  });

  it('connecte un patient avec le bon rôle', async () => {
    const r = await api().post('/api/login').send({ email: PATIENT, motDePasse: MOT_DE_PASSE });
    expect(r.status).toBe(200);
    expect(r.body.utilisateur.role).toBe('patient');
  });

  it('ignore la casse et les espaces autour de l’e-mail', async () => {
    const r = await api().post('/api/login').send({ email: '  SAM.LEFEVRE@Example.com ', motDePasse: MOT_DE_PASSE });
    expect(r.status).toBe(200);
  });

  it('ne renvoie jamais le hash ni le mot de passe', async () => {
    const r = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: MOT_DE_PASSE });
    const texte = JSON.stringify(r.body);
    expect(texte).not.toMatch(/hash|\$2[aby]\$/i);
    expect(texte).not.toContain(MOT_DE_PASSE);
  });

  it('le jeton contient l’id et le rôle, expire dans 8 h, en HS256', async () => {
    const r = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: MOT_DE_PASSE });
    const { header, payload } = jwt.decode(r.body.token, { complete: true });
    expect(header.alg).toBe('HS256');
    expect(payload).toMatchObject({ id: r.body.utilisateur.id, role: 'praticien' });
    expect(payload.exp - payload.iat).toBe(8 * 3600);
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    const r = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: 'mauvais' });
    expect(r.status).toBe(401);
    expect(r.body.erreur).toBe('Identifiants invalides');
  });

  it('renvoie exactement la même réponse pour un e-mail inconnu (pas de fuite sur les comptes)', async () => {
    const mauvaisMdp = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: 'mauvais' });
    const inconnu = await api().post('/api/login').send({ email: 'personne@example.com', motDePasse: 'mauvais' });
    expect(inconnu.status).toBe(mauvaisMdp.status);
    expect(inconnu.body).toEqual(mauvaisMdp.body);
  });

  it.each([
    ['corps vide', {}],
    ['e-mail absent', { motDePasse: MOT_DE_PASSE }],
    ['mot de passe absent', { email: PRATICIEN }],
    ['mot de passe numérique', { email: PRATICIEN, motDePasse: 123456 }],
    ['e-mail sous forme d’objet (tentative d’injection NoSQL)', { email: { $ne: '' }, motDePasse: MOT_DE_PASSE }],
    ['mot de passe de 73 caractères', { email: PRATICIEN, motDePasse: 'a'.repeat(73) }],
    ['e-mail de 255 caractères', { email: 'a'.repeat(255), motDePasse: MOT_DE_PASSE }],
  ])('refuse une requête invalide : %s (400)', async (_nom, corps) => {
    const r = await api().post('/api/login').send(corps);
    expect(r.status).toBe(400);
  });

  it('accepte un mot de passe de 72 caractères (limite bcrypt) sans erreur serveur', async () => {
    const r = await api().post('/api/login').send({ email: PRATICIEN, motDePasse: 'a'.repeat(72) });
    expect(r.status).toBe(401);
  });

  it('une injection SQL dans l’e-mail échoue simplement (401)', async () => {
    const r = await api().post('/api/login').send({ email: "' OR '1'='1", motDePasse: "' OR '1'='1" });
    expect(r.status).toBe(401);
  });

  it('un JSON mal formé renvoie 400, pas 500', async () => {
    const r = await api().post('/api/login').set('Content-Type', 'application/json').send('{"email":');
    expect(r.status).toBe(400);
  });
});

describe('GET /api/session et validation du jeton', () => {
  it('la spécialité est renvoyée pour un praticien (connexion et session), jamais pour un patient', async () => {
    const sam = await connexion(PRATICIEN);
    expect(sam.specialite).toBe('kinésithérapeute');
    expect((await api().get('/api/session').set(sam.entetes)).body.specialite).toBe('kinésithérapeute');
    const lea = await connexion(PATIENT);
    expect(lea).not.toHaveProperty('specialite');
  });

  it('renvoie l’utilisateur connecté', async () => {
    const u = await connexion(PATIENT);
    const r = await api().get('/api/session').set(u.entetes);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ id: u.id, role: 'patient', prenom: 'Léa', nom: 'Martin' });
  });

  it.each([
    ['sans en-tête Authorization', {}],
    ['schéma Basic au lieu de Bearer', { Authorization: 'Basic abc' }],
    ['Bearer sans jeton', { Authorization: 'Bearer' }],
    ['jeton n’importe quoi', { Authorization: 'Bearer pas.un.jeton' }],
  ])('refuse : %s (401)', async (_nom, entetes) => {
    const r = await api().get('/api/session').set(entetes);
    expect(r.status).toBe(401);
  });

  it('refuse un jeton signé avec un autre secret', async () => {
    const r = await api().get('/api/session').set(bearer(jeton({ id: 1, role: 'praticien' }, {}, 'autre-secret')));
    expect(r.status).toBe(401);
  });

  it('refuse un jeton expiré', async () => {
    const r = await api().get('/api/session').set(bearer(jeton({ id: 1, role: 'praticien' }, { expiresIn: -10 })));
    expect(r.status).toBe(401);
  });

  it('refuse un jeton signé avec un autre algorithme (HS512), même avec le bon secret', async () => {
    const r = await api().get('/api/session').set(bearer(jeton({ id: 1, role: 'praticien' }, { algorithm: 'HS512' })));
    expect(r.status).toBe(401);
  });

  it('refuse un jeton « alg: none » (non signé)', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const forge = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: 1, role: 'praticien' })}.`;
    const r = await api().get('/api/session').set(bearer(forge));
    expect(r.status).toBe(401);
  });

  it('refuse un jeton valide dont l’utilisateur n’existe plus (401)', async () => {
    const r = await api().get('/api/session').set(bearer(jeton({ id: 99999999, role: 'patient' })));
    expect(r.status).toBe(401);
  });
});

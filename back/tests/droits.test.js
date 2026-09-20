const { api, connexion, idPatient, dossier, dansNJours, PRATICIEN, PATIENT } = require('./aide');

let praticien, patient, idLea;

beforeAll(async () => {
  praticien = await connexion(PRATICIEN);
  patient = await connexion(PATIENT);
  idLea = await idPatient(praticien, 'Martin');
});

// [libellé, méthode, url, corps]
const routesPraticien = () => [
  ['GET /api/praticiens', 'get', '/api/praticiens'],
  ['GET /api/patients', 'get', '/api/patients'],
  ['GET /api/patients/:id', 'get', `/api/patients/${idLea}`],
  ['PATCH /api/patients/:id/etapes/:idEtape', 'patch', `/api/patients/${idLea}/etapes/1`, { statut: 'en_cours' }],
  ['POST /api/patients/:id/seances', 'post', `/api/patients/${idLea}/seances`, { dateHeure: dansNJours(9) }],
  ['POST /api/patients/:id/notes', 'post', `/api/patients/${idLea}/notes`, { contenu: 'Ne doit pas être créée' }],
];
const routesConnecte = () => [
  ['GET /api/session', 'get', '/api/session'],
  ['GET /api/parcours', 'get', '/api/parcours'],
];

const envoyer = (methode, url, corps, entetes = {}) => {
  const req = api()[methode](url).set(entetes);
  return corps ? req.send(corps) : req;
};

describe('Sans jeton : 401 partout sauf routes publiques', () => {
  it('toutes les routes protégées renvoient 401', async () => {
    const toutes = [...routesPraticien(), ...routesConnecte(), ['GET /api/moi/dossier', 'get', '/api/moi/dossier']];
    for (const [nom, methode, url, corps] of toutes) {
      const r = await envoyer(methode, url, corps);
      expect(r.status, nom).toBe(401);
    }
  });
});

describe('Un patient ne peut rien faire côté praticien', () => {
  it('reçoit 403 sur chaque route réservée aux praticiens', async () => {
    for (const [nom, methode, url, corps] of routesPraticien()) {
      const r = await envoyer(methode, url, corps, patient.entetes);
      expect(r.status, nom).toBe(403);
      expect(r.body.erreur).toBe('Accès refusé');
    }
  });

  it('un refus 403 n’a aucun effet : aucune note ni séance créée', async () => {
    const avant = await dossier(praticien, idLea);
    await api().post(`/api/patients/${idLea}/notes`).set(patient.entetes).send({ contenu: 'Tentative patient' });
    await api().post(`/api/patients/${idLea}/seances`).set(patient.entetes).send({ dateHeure: dansNJours(12) });
    const apres = await dossier(praticien, idLea);
    expect(apres.notes).toHaveLength(avant.notes.length);
    expect(apres.seancesAVenir).toHaveLength(avant.seancesAVenir.length);
  });

  it('ne peut pas consulter le dossier d’un autre patient en changeant l’adresse', async () => {
    const r = await api().get(`/api/patients/${idLea}`).set(patient.entetes);
    expect(r.status).toBe(403);
  });
});

describe('Un praticien n’a pas accès à la vue patient', () => {
  it('GET /api/moi/dossier renvoie 403', async () => {
    const r = await api().get('/api/moi/dossier').set(praticien.entetes);
    expect(r.status).toBe(403);
  });
});

describe('Routes ouvertes à tout utilisateur connecté', () => {
  it.each([['praticien'], ['patient']])('GET /api/parcours et /api/session répondent 200 pour un %s', async (role) => {
    const u = role === 'praticien' ? praticien : patient;
    for (const [nom, methode, url] of routesConnecte()) {
      const r = await envoyer(methode, url, null, u.entetes);
      expect(r.status, nom).toBe(200);
    }
  });

  it('GET /api/parcours renvoie le parcours avec ses 5 étapes ordonnées', async () => {
    const r = await api().get('/api/parcours').set(patient.entetes);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].nom).toBe('Préparation Marathon');
    expect(r.body[0].etapes.map((e) => e.position)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('Le rôle vient du jeton signé, pas du corps de la requête', () => {
  it('un jeton patient reste patient même si la requête affirme le contraire', async () => {
    const r = await api()
      .get('/api/patients')
      .set(patient.entetes)
      .query({ role: 'praticien' })
      .send({ role: 'praticien' });
    expect(r.status).toBe(403);
  });

  it('/moi/dossier renvoie toujours le dossier du jeton, jamais celui d’un id passé dans la requête', async () => {
    const karim = await connexion('karim.benali@example.com');
    const r = await api().get('/api/moi/dossier').query({ id: idLea, idPatient: idLea }).set(karim.entetes);
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(karim.id);
    expect(r.body.id).not.toBe(idLea);
    expect(r.body.nom).toBe('Benali');
  });
});

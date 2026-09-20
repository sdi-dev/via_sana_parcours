const pool = require('../src/db');
const { api, connexion, idPatient, dossier, dansNJours, PRATICIEN, AUTRE_PRATICIEN } = require('./aide');

let sam, alex, idLea, etapes;

const seance = (u, id, corps) => api().post(`/api/patients/${id}/seances`).set(u.entetes).send(corps);
const note = (u, id, corps) => api().post(`/api/patients/${id}/notes`).set(u.entetes).send(corps);

beforeAll(async () => {
  sam = await connexion(PRATICIEN);
  alex = await connexion(AUTRE_PRATICIEN);
  idLea = await idPatient(sam, 'Martin');
  etapes = (await api().get('/api/parcours').set(sam.entetes)).body[0].etapes.map((e) => e.id);
});

describe('POST /api/patients/:id/seances', () => {
  it('planifie une séance dans le futur (201) et elle apparaît dans « à venir »', async () => {
    const r = await seance(sam, idLea, { dateHeure: dansNJours(20) });
    expect(r.status).toBe(201);
    expect(r.body.id).toEqual(expect.any(Number));
    const d = await dossier(sam, idLea);
    const creee = d.seancesAVenir.find((s) => s.id === r.body.id);
    expect(creee).toMatchObject({ statut: 'prevue', etape: null });
  });

  // Ces deux tests figent la convention « tout est stocké en UTC » (db.js : timezone 'Z').
  // Un simple aller-retour ne suffirait pas : écriture et lecture se décaleraient de la même façon.
  it('écrit l’heure en UTC dans la base, quel que soit le fuseau de la machine', async () => {
    const r = await seance(sam, idLea, { dateHeure: '2031-03-10T16:30:00.000Z' });
    expect(r.status).toBe(201);
    const [[ligne]] = await pool.query('SELECT CAST(date_heure AS CHAR) AS brut FROM seance WHERE id_seance = ?', [r.body.id]);
    expect(ligne.brut).toBe('2031-03-10 16:30:00');
  });

  it('lit une heure stockée en UTC et la renvoie en ISO avec le suffixe Z', async () => {
    const [res] = await pool.query(
      'INSERT INTO seance (id_patient, id_praticien, id_etape, date_heure, statut) VALUES (?, ?, NULL, ?, ?)',
      [idLea, sam.id, '2031-04-12 09:15:00', 'prevue']
    );
    const d = await dossier(sam, idLea);
    expect(d.seancesAVenir.find((s) => s.id === res.insertId).dateHeure).toBe('2031-04-12T09:15:00.000Z');
  });

  it('le praticien de la séance est le praticien connecté, même si le corps en désigne un autre', async () => {
    const parSam = await seance(sam, idLea, { dateHeure: dansNJours(21), idPraticien: alex.id, id_praticien: alex.id });
    const parAlex = await seance(alex, idLea, { dateHeure: dansNJours(22) });
    const d = await dossier(sam, idLea);
    expect(d.seancesAVenir.find((s) => s.id === parSam.body.id)).toMatchObject({ praticienNom: 'Lefèvre', praticienSpecialite: 'kinésithérapeute' });
    expect(d.seancesAVenir.find((s) => s.id === parAlex.body.id)).toMatchObject({ praticienNom: 'Garnier', praticienSpecialite: 'coordinateur de soins' });
  });

  it('accepte une étape du parcours du patient et la rattache à la séance', async () => {
    const r = await seance(sam, idLea, { dateHeure: dansNJours(23), idEtape: etapes[2] });
    expect(r.status).toBe(201);
    const d = await dossier(sam, idLea);
    expect(d.seancesAVenir.find((s) => s.id === r.body.id).etape).toBe("Plan d'action");
  });

  it('accepte idEtape à null', async () => {
    expect((await seance(sam, idLea, { dateHeure: dansNJours(24), idEtape: null })).status).toBe(201);
  });

  it.each([
    ['une date passée', () => ({ dateHeure: dansNJours(-1) })],
    ['maintenant moins une minute', () => ({ dateHeure: new Date(Date.now() - 60_000).toISOString() })],
    ['un texte qui n’est pas une date', () => ({ dateHeure: 'demain matin' })],
    ['une date absente', () => ({})],
    ['un timestamp numérique', () => ({ dateHeure: Date.now() + 86_400_000 })],
    ['une date nulle', () => ({ dateHeure: null })],
  ])('refuse %s (400)', async (_n, corps) => {
    const r = await seance(sam, idLea, corps());
    expect(r.status).toBe(400);
    expect(r.body.erreur).toMatch(/^Date invalide/);
  });

  it('refuse une requête sans corps (400)', async () => {
    const r = await api().post(`/api/patients/${idLea}/seances`).set(sam.entetes);
    expect(r.status).toBe(400);
  });

  it('refuse un idEtape invalide (400) ou hors du parcours du patient (400)', async () => {
    expect((await seance(sam, idLea, { dateHeure: dansNJours(25), idEtape: 'abc' })).status).toBe(400);
    expect((await seance(sam, idLea, { dateHeure: dansNJours(25), idEtape: 999999 })).status).toBe(400);
  });

  it('patient inexistant → 404 ; identifiant non numérique → 400', async () => {
    expect((await seance(sam, 99999999, { dateHeure: dansNJours(26) })).status).toBe(404);
    expect((await seance(sam, 'abc', { dateHeure: dansNJours(26) })).status).toBe(400);
  });

  it('un refus ne crée aucune séance', async () => {
    const avant = (await dossier(sam, idLea)).seancesAVenir.length;
    await seance(sam, idLea, { dateHeure: dansNJours(-5) });
    await seance(sam, idLea, { dateHeure: 'nimporte quoi' });
    expect((await dossier(sam, idLea)).seancesAVenir).toHaveLength(avant);
  });
});

describe('POST /api/patients/:id/notes', () => {
  it('crée une note privée par défaut (201), signée par le praticien connecté', async () => {
    const r = await note(sam, idLea, { contenu: 'Note par défaut' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ contenu: 'Note par défaut', visiblePatient: false, id: expect.any(Number) });
    expect(new Date(r.body.dateCreation).getTime()).toBeGreaterThan(Date.now() - 60_000);
    const d = await dossier(sam, idLea);
    expect(d.notes.find((n) => n.id === r.body.id)).toMatchObject({ auteurNom: 'Lefèvre', auteurSpecialite: 'kinésithérapeute', visiblePatient: false });
  });

  it('crée une note partagée avec visiblePatient: true', async () => {
    const r = await note(alex, idLea, { contenu: 'Note partagée', visiblePatient: true });
    expect(r.status).toBe(201);
    expect(r.body.visiblePatient).toBe(true);
    const d = await dossier(sam, idLea);
    expect(d.notes.find((n) => n.id === r.body.id)).toMatchObject({ auteurNom: 'Garnier', visiblePatient: true });
  });

  it('supprime les espaces en début et fin de note', async () => {
    const r = await note(sam, idLea, { contenu: '   texte propre \n ' });
    expect(r.body.contenu).toBe('texte propre');
  });

  it('accepte 1 caractère et 2000 caractères', async () => {
    expect((await note(sam, idLea, { contenu: 'a' })).status).toBe(201);
    expect((await note(sam, idLea, { contenu: 'é'.repeat(2000) })).status).toBe(201);
  });

  it.each([
    ['vide', { contenu: '' }],
    ['uniquement des espaces', { contenu: '   \n\t ' }],
    ['2001 caractères', { contenu: 'a'.repeat(2001) }],
    ['absente', {}],
    ['numérique', { contenu: 123 }],
    ['nulle', { contenu: null }],
    ['en tableau', { contenu: ['a'] }],
    ['visiblePatient en chaîne « true »', { contenu: 'ok', visiblePatient: 'true' }],
    ['visiblePatient numérique', { contenu: 'ok', visiblePatient: 1 }],
    ['visiblePatient nul', { contenu: 'ok', visiblePatient: null }],
  ])('refuse une note invalide : %s (400)', async (_n, corps) => {
    const r = await note(sam, idLea, corps);
    expect(r.status).toBe(400);
    expect(r.body.erreur).toBe('Note invalide (1 à 2000 caractères)');
  });

  it('refuse une requête sans corps (400)', async () => {
    expect((await api().post(`/api/patients/${idLea}/notes`).set(sam.entetes)).status).toBe(400);
  });

  it('patient inexistant → 404 ; identifiant non numérique → 400', async () => {
    expect((await note(sam, 99999999, { contenu: 'x' })).status).toBe(404);
    expect((await note(sam, 'abc', { contenu: 'x' })).status).toBe(400);
  });

  it('un contenu piégé est stocké tel quel, sans effet sur la base (requêtes paramétrées)', async () => {
    const piege = "'); DROP TABLE note_suivi; -- <script>alert(1)</script>";
    const r = await note(sam, idLea, { contenu: piege });
    expect(r.status).toBe(201);
    const d = await dossier(sam, idLea);
    expect(d.notes.find((n) => n.id === r.body.id).contenu).toBe(piege);
    expect(d.notes.length).toBeGreaterThan(1); // la table existe toujours, avec ses autres lignes
  });

  it('les notes sont renvoyées de la plus récente à la plus ancienne', async () => {
    const d = await dossier(sam, idLea);
    const dates = d.notes.map((n) => new Date(n.dateCreation).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('un refus ne crée aucune note', async () => {
    const avant = (await dossier(sam, idLea)).notes.length;
    await note(sam, idLea, { contenu: '' });
    await note(sam, idLea, { contenu: 'a'.repeat(2001) });
    expect((await dossier(sam, idLea)).notes).toHaveLength(avant);
  });
});

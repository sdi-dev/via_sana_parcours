const { api, connexion, idPatient, dossier, PRATICIEN, PATIENT } = require('./aide');

let praticien, patient, idLea, emailsPraticiens;
const marqueur = Date.now().toString(36);
const PRIVEE = `PRIVEE-${marqueur}`;
const PARTAGEE = `PARTAGEE-${marqueur}`;

beforeAll(async () => {
  praticien = await connexion(PRATICIEN);
  patient = await connexion(PATIENT);
  idLea = await idPatient(praticien, 'Martin');
  emailsPraticiens = (await api().get('/api/praticiens').set(praticien.entetes)).body.map((p) => p.email);

  // Une note privée et une note partagée créées par ce test, avec un marqueur unique
  await api().post(`/api/patients/${idLea}/notes`).set(praticien.entetes).send({ contenu: PRIVEE, visiblePatient: false });
  await api().post(`/api/patients/${idLea}/notes`).set(praticien.entetes).send({ contenu: PARTAGEE, visiblePatient: true });
});

describe('Notes : le patient ne voit que ce qui est partagé', () => {
  it('la vue patient contient la note partagée', async () => {
    const r = await api().get('/api/moi/dossier').set(patient.entetes);
    expect(r.body.notes.map((n) => n.contenu)).toContain(PARTAGEE);
  });

  it('la vue patient ne contient JAMAIS la note privée', async () => {
    const r = await api().get('/api/moi/dossier').set(patient.entetes);
    expect(r.body.notes.map((n) => n.contenu)).not.toContain(PRIVEE);
    expect(JSON.stringify(r.body)).not.toContain(PRIVEE);
  });

  it('toutes les notes renvoyées au patient sont marquées partagées', async () => {
    const r = await api().get('/api/moi/dossier').set(patient.entetes);
    expect(r.body.notes.length).toBeGreaterThan(0);
    expect(r.body.notes.every((n) => n.visiblePatient === true)).toBe(true);
  });

  it('la fiche praticien contient les deux notes', async () => {
    const d = await dossier(praticien, idLea);
    const contenus = d.notes.map((n) => n.contenu);
    expect(contenus).toContain(PRIVEE);
    expect(contenus).toContain(PARTAGEE);
  });

  it('les notes privées du jeu de démonstration restent invisibles pour chaque patient', async () => {
    for (const email of ['karim.benali@example.com', 'hugo.roux@example.com', 'nathan.blanc@example.com', 'chloe.petit@example.com']) {
      const u = await connexion(email);
      const r = await api().get('/api/moi/dossier').set(u.entetes);
      expect(r.body.notes.every((n) => n.visiblePatient === true), email).toBe(true);
    }
  });
});

describe('E-mails des praticiens : réservés aux praticiens', () => {
  it('la fiche praticien expose l’e-mail de chaque praticien de l’équipe', async () => {
    const d = await dossier(praticien, idLea);
    expect(d.praticiens.length).toBeGreaterThan(0);
    for (const p of d.praticiens) expect(p.email).toMatch(/@/);
  });

  it('la vue patient n’a aucune propriété email sur les praticiens', async () => {
    const r = await api().get('/api/moi/dossier').set(patient.entetes);
    expect(r.body.praticiens.length).toBeGreaterThan(0);
    for (const p of r.body.praticiens) expect(p).not.toHaveProperty('email');
  });

  it('aucun e-mail de praticien n’apparaît nulle part dans la réponse du patient', async () => {
    const texte = JSON.stringify((await api().get('/api/moi/dossier').set(patient.entetes)).body);
    expect(emailsPraticiens.length).toBe(5);
    for (const email of emailsPraticiens) expect(texte).not.toContain(email);
  });

  it('l’annuaire des praticiens est fermé aux patients', async () => {
    const r = await api().get('/api/praticiens').set(patient.entetes);
    expect(r.status).toBe(403);
    expect(JSON.stringify(r.body)).not.toContain('@');
  });
});

describe('Le patient ne voit que son propre dossier', () => {
  it('chaque patient reçoit son propre dossier, quelle que soit la requête', async () => {
    for (const [email, nom] of [['lea.martin@example.com', 'Martin'], ['karim.benali@example.com', 'Benali'], ['sophie.lambert@example.com', 'Lambert']]) {
      const u = await connexion(email);
      const r = await api().get('/api/moi/dossier').set(u.entetes);
      expect(r.status).toBe(200);
      expect(r.body.id).toBe(u.id);
      expect(r.body.nom).toBe(nom);
    }
  });
});

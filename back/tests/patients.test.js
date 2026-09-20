const { api, connexion, idPatient, dossier, PRATICIEN, PATIENT } = require('./aide');

const STATUTS = ['a_demarrer', 'en_cours', 'termine'];
const NOMS = ['Martin', 'Benali', 'Lambert', 'Girard', 'Petit', 'Roux', 'Faure', 'Blanc'];
let praticien, tous;

const liste = (query = {}) => api().get('/api/patients').query(query).set(praticien.entetes);

beforeAll(async () => {
  praticien = await connexion(PRATICIEN);
  tous = (await liste()).body;
});

describe('GET /api/patients', () => {
  it('renvoie les 8 patients du jeu de démonstration, triés par prénom', () => {
    expect(tous).toHaveLength(8);
    const prenoms = tous.map((p) => p.prenom);
    expect(prenoms).toEqual([...prenoms].sort((a, b) => a.localeCompare(b, 'fr')));
  });

  it('chaque patient a les champs attendus, avec les bons types', () => {
    for (const p of tous) {
      expect(p).toMatchObject({ id: expect.any(Number), prenom: expect.any(String), nom: expect.any(String), parcours: 'Préparation Marathon' });
      expect(p.etapesTotal).toBe(5);
      expect(typeof p.etapesRealisees).toBe('number'); // pas une chaîne : le CAST fait son travail
      expect(STATUTS).toContain(p.statut);
    }
  });

  it('le statut est cohérent avec la progression', () => {
    for (const p of tous) {
      if (p.etapesRealisees === 0) expect(p.statut).toBe('a_demarrer');
      else if (p.etapesRealisees === p.etapesTotal) expect(p.statut).toBe('termine');
      else expect(p.statut).toBe('en_cours');
    }
  });

  it('un parcours terminé n’a pas d’étape en cours', () => {
    const emma = tous.find((p) => p.nom === 'Faure');
    expect(emma.statut).toBe('termine');
    expect(emma.idEtapeEnCours).toBeNull();
  });
});

describe('Filtres', () => {
  it('statut=termine ne renvoie que des parcours terminés (dont Emma Faure)', async () => {
    const r = await liste({ statut: 'termine' });
    expect(r.status).toBe(200);
    expect(r.body.every((p) => p.statut === 'termine')).toBe(true);
    expect(r.body.map((p) => p.nom)).toContain('Faure');
  });

  it.each(['a_demarrer', 'en_cours'])('statut=%s ne renvoie que ce statut', async (statut) => {
    const r = await liste({ statut });
    expect(r.status).toBe(200);
    expect(r.body.every((p) => p.statut === statut)).toBe(true);
  });

  it('statut=en_cours exclut Emma Faure', async () => {
    const r = await liste({ statut: 'en_cours' });
    expect(r.body.map((p) => p.nom)).not.toContain('Faure');
  });

  it.each([['statut inconnu', { statut: 'bidon' }], ['statut piégé', { statut: "en_cours' OR 1=1--" }]])(
    '%s → 400', async (_n, query) => {
      expect((await liste(query)).status).toBe(400);
    });

  it('etape=<id> ne renvoie que les patients dont c’est l’étape en cours', async () => {
    const parcours = (await api().get('/api/parcours').set(praticien.entetes)).body[0];
    const bilan = parcours.etapes.find((e) => e.libelle === 'Bilan kiné');
    const r = await liste({ etape: bilan.id });
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body.every((p) => p.idEtapeEnCours === bilan.id)).toBe(true);
    expect(r.body[0].etapeEnCours).toBe('Bilan kiné');
  });

  it.each([['abc'], ['1;DROP TABLE patient'], ['-1'], ['1.5']])('etape=%s → 400', async (etape) => {
    expect((await liste({ etape })).status).toBe(400);
  });

  it('parcours=<id> renvoie tous les patients, un parcours inexistant renvoie une liste vide', async () => {
    const parcours = (await api().get('/api/parcours').set(praticien.entetes)).body[0];
    expect((await liste({ parcours: parcours.id })).body).toHaveLength(8);
    const vide = await liste({ parcours: 999999 });
    expect(vide.status).toBe(200);
    expect(vide.body).toEqual([]);
  });

  it('parcours=abc → 400', async () => {
    expect((await liste({ parcours: 'abc' })).status).toBe(400);
  });

  it('les filtres se combinent', async () => {
    const r = await liste({ statut: 'termine', q: 'Faure' });
    expect(r.body.map((p) => p.nom)).toEqual(['Faure']);
    const aucun = await liste({ statut: 'termine', q: 'Martin' });
    expect(aucun.body).toEqual([]);
  });
});

describe('Recherche q', () => {
  it.each(NOMS)('q=%s retrouve exactement ce patient', async (nom) => {
    const r = await liste({ q: nom });
    expect(r.body.map((p) => p.nom)).toEqual([nom]);
  });

  it('cherche aussi dans le prénom, sans tenir compte de la casse', async () => {
    const r = await liste({ q: 'karim' });
    expect(r.body.map((p) => p.nom)).toEqual(['Benali']);
  });

  it('une recherche vide renvoie tout le monde', async () => {
    expect((await liste({ q: '' })).body).toHaveLength(8);
  });

  it('un caractère générique n’est pas interprété : %, _ et \\ ne ramènent rien', async () => {
    for (const q of ['%', '_', '\\', '%%', 'M_rtin']) {
      const r = await liste({ q });
      expect(r.status, q).toBe(200);
      expect(r.body, q).toEqual([]);
    }
  });

  it('une tentative d’injection SQL ne ramène rien et ne casse rien', async () => {
    for (const q of ["' OR '1'='1", "'; DROP TABLE patient; --", "x' UNION SELECT * FROM utilisateur -- "]) {
      const r = await liste({ q });
      expect(r.status, q).toBe(200);
      expect(r.body, q).toEqual([]);
    }
    expect((await liste()).body).toHaveLength(8); // la table est toujours là
  });

  it('refuse une recherche de plus de 100 caractères, ou passée en tableau', async () => {
    expect((await liste({ q: 'a'.repeat(101) })).status).toBe(400);
    expect((await liste({ q: 'a'.repeat(100) })).status).toBe(200);
    expect((await api().get('/api/patients?q=a&q=b').set(praticien.entetes)).status).toBe(400);
  });
});

describe('GET /api/patients/:id', () => {
  it('renvoie le dossier complet de Léa Martin', async () => {
    const id = await idPatient(praticien, 'Martin');
    const d = await dossier(praticien, id);
    expect(d).toMatchObject({ id, prenom: 'Léa', nom: 'Martin', parcours: 'Préparation Marathon', age: 31, sexe: 'femme' });
    for (const cle of ['etapes', 'praticiens', 'seancesAVenir', 'seancesPassees', 'notes', 'questionnaire']) expect(d).toHaveProperty(cle);
    expect(d.etapes.map((e) => e.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it('dateCible est une date simple AAAA-MM-JJ (pas un décalage de fuseau)', async () => {
    const d = await dossier(praticien, await idPatient(praticien, 'Martin'));
    expect(d.dateCible).toBe('2027-04-11');
  });

  it('le questionnaire est typé : booléens, tableaux et JSON aplatis', async () => {
    const d = await dossier(praticien, await idPatient(praticien, 'Martin'));
    const r = d.questionnaire.reponses;
    expect(r.douleur_localisee).toEqual(['genou']);          // colonne SET → tableau
    expect(r.arret_plus_2_semaines).toBe(false);             // 0 → booléen
    expect(r.raideurs).toEqual(['genoux', 'hanches']);       // vient du JSON autres_reponses
    expect(r.volume_km_semaine).toBe(35);
    expect(r).not.toHaveProperty('consentement_rgpd');
    expect(r).not.toHaveProperty('autres_reponses');
  });

  it('plusieurs zones de douleur (Hugo Roux) donnent un tableau de deux éléments', async () => {
    const d = await dossier(praticien, await idPatient(praticien, 'Roux'));
    expect([...d.questionnaire.reponses.douleur_localisee].sort()).toEqual(['dos_lombaire', 'hanche_bassin']);
    expect(d.questionnaire.reponses.chirurgie).toBe(true);
  });

  it('Sophie Lambert n’a pas de questionnaire (null)', async () => {
    const d = await dossier(praticien, await idPatient(praticien, 'Lambert'));
    expect(d.questionnaire).toBeNull();
  });

  it('les dates de séance sont des ISO en UTC', async () => {
    const d = await dossier(praticien, await idPatient(praticien, 'Martin'));
    expect(d.seancesAVenir.length).toBeGreaterThan(0);
    for (const s of [...d.seancesAVenir, ...d.seancesPassees]) expect(s.dateHeure).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    for (const s of d.seancesAVenir) expect(new Date(s.dateHeure).getTime()).toBeGreaterThanOrEqual(Date.now());
  });

  it('un patient n’a jamais plus d’une étape en cours, et les statuts respectent l’ordre réalisée → en cours → à venir', async () => {
    const ordre = { realisee: 0, en_cours: 1, a_venir: 2 };
    for (const p of tous) {
      const { etapes } = await dossier(praticien, p.id);
      expect(etapes.filter((e) => e.statut === 'en_cours').length, p.nom).toBeLessThanOrEqual(1);
      const rangs = etapes.map((e) => ordre[e.statut]);
      expect(rangs, p.nom).toEqual([...rangs].sort((a, b) => a - b));
      for (const e of etapes) expect(Boolean(e.dateRealisation), `${p.nom} étape ${e.position}`).toBe(e.statut === 'realisee');
    }
  });

  it('id inconnu → 404', async () => {
    const r = await api().get('/api/patients/99999999').set(praticien.entetes);
    expect(r.status).toBe(404);
    expect(r.body.erreur).toBe('Patient introuvable');
  });

  it('l’id d’un praticien n’est pas un patient → 404', async () => {
    const r = await api().get(`/api/patients/${praticien.id}`).set(praticien.entetes);
    expect(r.status).toBe(404);
  });

  it.each([['abc'], ['-1'], ['1.5'], ['1%20OR%201=1'], ['0']])('id « %s » → 400', async (id) => {
    const r = await api().get(`/api/patients/${id}`).set(praticien.entetes);
    expect(r.status).toBe(400);
  });
});

describe('GET /api/moi/dossier (patient)', () => {
  it('renvoie la même structure que la fiche praticien', async () => {
    const lea = await connexion(PATIENT);
    const vue = (await api().get('/api/moi/dossier').set(lea.entetes)).body;
    const fiche = await dossier(praticien, lea.id);
    expect(Object.keys(vue).sort()).toEqual(Object.keys(fiche).sort());
    expect(vue.etapes).toEqual(fiche.etapes);
    expect(vue.questionnaire).toEqual(fiche.questionnaire);
  });
});

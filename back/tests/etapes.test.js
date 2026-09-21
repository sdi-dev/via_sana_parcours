const { api, connexion, idPatient, dossier, PRATICIEN, AUTRE_PRATICIEN } = require('./aide');

// Ce fichier fait avancer Sophie Lambert (au départ : étape 1 en cours, les 4 autres à venir)
// Karim Benali sert à vérifier qu'un refus ne modifie rien, Thomas Girard aux étapes réservées.
// Sam Lefèvre est kiné, Alex Garnier coordinateur de soins.
let praticien, alex, idSophie, idKarim, idThomas, etapes; // etapes = ids des 5 étapes, dans l'ordre

const patch = (id, idEtape, corps, acteur = praticien) => api().patch(`/api/patients/${id}/etapes/${idEtape}`).set(acteur.entetes).send(corps);
const statuts = async (id) => (await dossier(praticien, id)).etapes.map((e) => e.statut);

beforeAll(async () => {
  praticien = await connexion(PRATICIEN);
  idSophie = await idPatient(praticien, 'Lambert');
  idKarim = await idPatient(praticien, 'Benali');
  idThomas = await idPatient(praticien, 'Girard');
  alex = await connexion(AUTRE_PRATICIEN);
  etapes = (await api().get('/api/parcours').set(praticien.entetes)).body[0].etapes.map((e) => e.id);
});

describe('Transitions d’étapes (patient : Sophie Lambert)', () => {
  it('point de départ : étape 1 en cours, le reste à venir', async () => {
    expect(await statuts(idSophie)).toEqual(['en_cours', 'a_venir', 'a_venir', 'a_venir', 'a_venir']);
  });

  it('refuse de démarrer une étape quand une autre est déjà en cours (409)', async () => {
    const r = await patch(idSophie, etapes[2], { statut: 'en_cours' });
    expect(r.status).toBe(409);
    expect(r.body.erreur).toBe('Une autre étape est déjà en cours');
  });

  it('refuse de terminer une étape qui n’a pas démarré : à venir → réalisée (409)', async () => {
    const r = await patch(idSophie, etapes[2], { statut: 'realisee' });
    expect(r.status).toBe(409);
    expect(r.body.erreur).toMatch(/^Transition impossible/);
  });

  it('un refus ne change rien', async () => {
    expect(await statuts(idSophie)).toEqual(['en_cours', 'a_venir', 'a_venir', 'a_venir', 'a_venir']);
  });

  it('terminer l’étape 1 (sans spécialité attendue, ici par le coordinateur) la marque réalisée, date la réalisation et démarre l’étape 2', async () => {
    const r = await patch(idSophie, etapes[0], { statut: 'realisee' }, alex);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ statut: 'realisee' });
    const d = await dossier(praticien, idSophie);
    expect(d.etapes.map((e) => e.statut)).toEqual(['realisee', 'en_cours', 'a_venir', 'a_venir', 'a_venir']);
    expect(new Date(d.etapes[0].dateRealisation).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    expect(new Date(d.etapes[0].dateRealisation).getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(d.etapes[1].dateRealisation).toBeNull();
  });

  it('la liste reflète le changement : 1 étape réalisée, étape en cours = Bilan kiné, statut en_cours', async () => {
    const [sophie] = (await api().get('/api/patients').query({ q: 'Lambert' }).set(praticien.entetes)).body;
    expect(sophie).toMatchObject({ etapesRealisees: 1, etapeEnCours: 'Bilan kiné', idEtapeEnCours: etapes[1], statut: 'en_cours' });
  });

  it('pas de retour en arrière : réalisée → réalisée et réalisée → en cours sont refusées (409)', async () => {
    expect((await patch(idSophie, etapes[0], { statut: 'realisee' })).status).toBe(409);
    expect((await patch(idSophie, etapes[0], { statut: 'en_cours' })).status).toBe(409);
  });

  it('une étape déjà en cours ne peut pas être « démarrée » une seconde fois (409)', async () => {
    expect((await patch(idSophie, etapes[1], { statut: 'en_cours' })).status).toBe(409);
  });

  it.each([
    ['statut « a_venir »', { statut: 'a_venir' }],
    ['statut inconnu', { statut: 'termine' }],
    ['statut numérique', { statut: 1 }],
    ['statut absent', {}],
  ])('refuse un corps invalide : %s (400)', async (_n, corps) => {
    expect((await patch(idSophie, etapes[1], corps)).status).toBe(400);
  });

  it('refuse une requête sans corps (400)', async () => {
    const r = await api().patch(`/api/patients/${idSophie}/etapes/${etapes[1]}`).set(praticien.entetes);
    expect(r.status).toBe(400);
  });

  it('identifiants non numériques → 400 ; étape ou patient inexistant → 404', async () => {
    expect((await patch('abc', etapes[1], { statut: 'realisee' })).status).toBe(400);
    expect((await patch(idSophie, 'abc', { statut: 'realisee' })).status).toBe(400);
    const etapeInconnue = await patch(idSophie, 999999, { statut: 'realisee' });
    expect(etapeInconnue.status).toBe(404);
    expect(etapeInconnue.body.erreur).toBe('Étape introuvable pour ce patient');
    expect((await patch(99999999, etapes[1], { statut: 'realisee' })).status).toBe(404);
  });

  it('on peut mener le parcours jusqu’au bout : à la fin, statut « termine » et plus aucune étape en cours', async () => {
    for (let i = 1; i < 5; i++) {
      const r = await patch(idSophie, etapes[i], { statut: 'realisee' }, i === 4 ? alex : praticien); // l'étape 5 est celle du coordinateur
      expect(r.status, `étape ${i + 1}`).toBe(200);
      const attendu = Array.from({ length: 5 }, (_, k) => (k <= i ? 'realisee' : k === i + 1 ? 'en_cours' : 'a_venir'));
      expect(await statuts(idSophie), `après l'étape ${i + 1}`).toEqual(attendu);
    }
    const [sophie] = (await api().get('/api/patients').query({ q: 'Lambert' }).set(praticien.entetes)).body;
    expect(sophie).toMatchObject({ etapesRealisees: 5, statut: 'termine', idEtapeEnCours: null });
  });

  it('une fois le parcours terminé, plus aucune transition n’est possible (409)', async () => {
    expect((await patch(idSophie, etapes[4], { statut: 'realisee' }, alex)).status).toBe(409);
    expect((await patch(idSophie, etapes[4], { statut: 'en_cours' }, alex)).status).toBe(409);
  });
});

describe('Étapes réservées à une spécialité (patient : Thomas Girard, étape 4 en cours)', () => {
  it('le coordinateur ne peut pas terminer l’étape du kiné (403), et rien ne change', async () => {
    const avant = (await dossier(praticien, idThomas)).etapes;
    const r = await patch(idThomas, etapes[3], { statut: 'realisee' }, alex);
    expect(r.status).toBe(403);
    expect(r.body.erreur).toBe('Cette étape est réservée : kinésithérapeute');
    expect((await dossier(praticien, idThomas)).etapes).toEqual(avant);
  });

  it('le kiné ne peut ni démarrer ni terminer l’étape du coordinateur (403 avant tout contrôle de transition)', async () => {
    expect((await patch(idThomas, etapes[4], { statut: 'en_cours' })).status).toBe(403);
    expect((await patch(idThomas, etapes[4], { statut: 'realisee' })).status).toBe(403);
  });

  it('le kiné termine son étape, ce qui démarre celle du coordinateur, qui la termine à son tour', async () => {
    expect((await patch(idThomas, etapes[3], { statut: 'realisee' })).status).toBe(200);
    expect((await dossier(praticien, idThomas)).etapes[4].statut).toBe('en_cours');
    expect((await patch(idThomas, etapes[4], { statut: 'realisee' }, alex)).status).toBe(200);
    expect((await dossier(praticien, idThomas)).etapes.every((e) => e.statut === 'realisee')).toBe(true);
  });
});

describe('Atomicité (patient : Karim Benali)', () => {
  it('un refus 409 laisse le dossier strictement identique', async () => {
    const avant = (await dossier(praticien, idKarim)).etapes;
    const dejaEnCours = avant.findIndex((e) => e.statut === 'en_cours');
    expect(dejaEnCours).toBeGreaterThanOrEqual(0);
    const cible = avant.findIndex((e) => e.statut === 'a_venir');
    expect((await patch(idKarim, etapes[cible], { statut: 'en_cours' })).status).toBe(409);
    expect((await patch(idKarim, etapes[cible], { statut: 'realisee' })).status).toBe(409);
    expect((await dossier(praticien, idKarim)).etapes).toEqual(avant);
  });
});

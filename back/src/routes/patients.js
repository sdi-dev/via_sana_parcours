const express = require('express');
const pool = require('../db');
const { authentifier, exigerRole } = require('../middlewares/auth');

const router = express.Router();

const connecte = [authentifier];
const praticienSeulement = [authentifier, exigerRole('praticien')];
const patientSeulement = [authentifier, exigerRole('patient')];

// Transmet les erreurs async au gestionnaire d'erreurs d'Express
const route = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const entier = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);

// ---------------------------------------------------------------------
// Parcours et étapes (alimente les filtres du front)
// ---------------------------------------------------------------------
router.get('/parcours', connecte, route(async (req, res) => {
  const [parcours] = await pool.query('SELECT id_parcours AS id, nom FROM parcours ORDER BY id_parcours');
  const [etapes] = await pool.query(
    'SELECT id_etape AS id, id_parcours AS idParcours, position, libelle FROM etape ORDER BY id_parcours, position'
  );
  res.json(parcours.map((p) => ({ ...p, etapes: etapes.filter((e) => e.idParcours === p.id) })));
}));

// ---------------------------------------------------------------------
// Annuaire des praticiens : coordonnées pour se contacter entre praticiens
// ---------------------------------------------------------------------
router.get('/praticiens', praticienSeulement, route(async (req, res) => {
  const [praticiens] = await pool.query(
    `SELECT pr.id_utilisateur AS id, u.prenom, u.nom, u.email, pr.specialite
       FROM praticien pr JOIN utilisateur u ON u.id_utilisateur = pr.id_utilisateur
      ORDER BY pr.specialite, u.nom`
  );
  res.json(praticiens);
}));

// ---------------------------------------------------------------------
// Liste des patients : filtres ?statut= ?etape= ?parcours= ?q=
// statut : a_demarrer | en_cours | termine ; etape = id de l'étape en cours
// ---------------------------------------------------------------------
const STATUTS = ['a_demarrer', 'en_cours', 'termine'];

router.get('/patients', praticienSeulement, route(async (req, res) => {
  const { statut, etape, parcours, q } = req.query;
  const conditions = [];
  const valeurs = [];

  if (statut !== undefined && !STATUTS.includes(statut)) return res.status(400).json({ erreur: 'Statut invalide' });
  if (etape !== undefined) {
    if (!entier(etape)) return res.status(400).json({ erreur: 'Étape invalide' });
    conditions.push('idEtapeEnCours = ?');
    valeurs.push(Number(etape));
  }
  if (parcours !== undefined) {
    if (!entier(parcours)) return res.status(400).json({ erreur: 'Parcours invalide' });
    conditions.push('idParcours = ?');
    valeurs.push(Number(parcours));
  }
  if (q !== undefined) {
    if (typeof q !== 'string' || q.length > 100) return res.status(400).json({ erreur: 'Recherche invalide' });
    conditions.push("CONCAT(prenom, ' ', nom) LIKE ?");
    valeurs.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
  }

  const [lignes] = await pool.query(
    `SELECT * FROM (
       SELECT p.id_utilisateur AS id, u.prenom, u.nom, p.objectif,
              pa.id_parcours AS idParcours, pa.nom AS parcours,
              CAST(COALESCE(SUM(av.statut = 'realisee'), 0) AS UNSIGNED) AS etapesRealisees,
              COUNT(av.id_etape) AS etapesTotal,
              MAX(CASE WHEN av.statut = 'en_cours' THEN e.id_etape END) AS idEtapeEnCours,
              MAX(CASE WHEN av.statut = 'en_cours' THEN e.libelle END) AS etapeEnCours,
              (SELECT MIN(s.date_heure) FROM seance s
                WHERE s.id_patient = p.id_utilisateur AND s.statut = 'prevue' AND s.date_heure >= ?) AS prochaineSeance
         FROM patient p
         JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
         JOIN parcours pa ON pa.id_parcours = p.id_parcours
         LEFT JOIN avancement av ON av.id_patient = p.id_utilisateur
         LEFT JOIN etape e ON e.id_etape = av.id_etape
        GROUP BY p.id_utilisateur, u.prenom, u.nom, p.objectif, pa.id_parcours, pa.nom
     ) liste
     ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
     ORDER BY prenom, nom`,
    [new Date(), ...valeurs]
  );

  const patients = lignes
    .map((l) => ({
      ...l,
      statut: l.etapesRealisees === 0 ? 'a_demarrer' : l.etapesRealisees === l.etapesTotal ? 'termine' : 'en_cours',
    }))
    .filter((p) => statut === undefined || p.statut === statut);

  res.json(patients);
}));

// ---------------------------------------------------------------------
// Dossier complet d'un patient (utilisé par la fiche praticien et par la vue patient)
// ---------------------------------------------------------------------
const BOOLEENS = ['arret_plus_2_semaines', 'malaise_syncope', 'chirurgie', 'medicaments_quotidiens'];

// Toutes les réponses à plat, clés = noms des questions
function formaterQuestionnaire(ligne) {
  if (!ligne) return null;
  const { id_questionnaire, id_patient, date_soumission, consentement_rgpd, date_consentement, autres_reponses, ...typees } = ligne;
  for (const cle of BOOLEENS) typees[cle] = Boolean(typees[cle]);
  typees.douleur_localisee = typees.douleur_localisee ? typees.douleur_localisee.split(',') : [];
  const autres = typeof autres_reponses === 'string' ? JSON.parse(autres_reponses) : autres_reponses;
  return { dateSoumission: date_soumission, reponses: { ...typees, ...autres } };
}

async function chargerDossier(idPatient, { notesVisiblesSeulement = false, contactPraticiens = false } = {}) {
  const [[identite], etapes, praticiens, seances, notes, [questionnaire]] = await Promise.all([
    pool.query(
      `SELECT p.id_utilisateur AS id, u.prenom, u.nom, u.email, p.telephone, p.sexe, p.age, p.objectif,
              p.date_cible AS dateCible, pa.id_parcours AS idParcours, pa.nom AS parcours
         FROM patient p
         JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
         JOIN parcours pa ON pa.id_parcours = p.id_parcours
        WHERE p.id_utilisateur = ?`, [idPatient]).then(([r]) => r),
    pool.query(
      `SELECT e.id_etape AS idEtape, e.position, e.libelle, e.specialite_attendue AS specialiteAttendue,
              av.statut, av.date_realisation AS dateRealisation
         FROM avancement av JOIN etape e ON e.id_etape = av.id_etape
        WHERE av.id_patient = ? ORDER BY e.position`, [idPatient]).then(([r]) => r),
    pool.query(
      `SELECT pr.id_utilisateur AS id, u.prenom, u.nom, u.email, pr.specialite
         FROM patient_praticien pp
         JOIN praticien pr ON pr.id_utilisateur = pp.id_praticien
         JOIN utilisateur u ON u.id_utilisateur = pr.id_utilisateur
        WHERE pp.id_patient = ? ORDER BY pr.specialite`, [idPatient]).then(([r]) => r),
    pool.query(
      `SELECT s.id_seance AS id, s.date_heure AS dateHeure, s.statut, e.libelle AS etape,
              u.prenom AS praticienPrenom, u.nom AS praticienNom, pr.specialite AS praticienSpecialite
         FROM seance s
         JOIN utilisateur u ON u.id_utilisateur = s.id_praticien
         JOIN praticien pr ON pr.id_utilisateur = s.id_praticien
         LEFT JOIN etape e ON e.id_etape = s.id_etape
        WHERE s.id_patient = ? ORDER BY s.date_heure`, [idPatient]).then(([r]) => r),
    pool.query(
      `SELECT n.id_note AS id, n.contenu, n.date_creation AS dateCreation, n.visible_patient AS visiblePatient,
              u.prenom AS auteurPrenom, u.nom AS auteurNom, pr.specialite AS auteurSpecialite
         FROM note_suivi n
         JOIN utilisateur u ON u.id_utilisateur = n.id_praticien
         JOIN praticien pr ON pr.id_utilisateur = n.id_praticien
        WHERE n.id_patient = ? ${notesVisiblesSeulement ? 'AND n.visible_patient = 1' : ''}
        ORDER BY n.date_creation DESC`, [idPatient]).then(([r]) => r),
    pool.query('SELECT * FROM questionnaire WHERE id_patient = ?', [idPatient]).then(([r]) => r),
  ]);
  if (!identite) return null;

  const maintenant = new Date();
  const aVenir = (s) => s.statut === 'prevue' && new Date(s.dateHeure) >= maintenant;
  return {
    ...identite,
    etapes,
    // L'email des praticiens n'est communiqué qu'aux praticiens (coordination), jamais au patient
    praticiens: praticiens.map(({ email, ...praticien }) => (contactPraticiens ? { ...praticien, email } : praticien)),
    seancesAVenir: seances.filter(aVenir),
    seancesPassees: seances.filter((s) => !aVenir(s)).reverse(),
    notes: notes.map((n) => ({ ...n, visiblePatient: Boolean(n.visiblePatient) })),
    questionnaire: formaterQuestionnaire(questionnaire),
  };
}

router.get('/patients/:id', praticienSeulement, route(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ erreur: 'Identifiant invalide' });
  const dossier = await chargerDossier(id, { contactPraticiens: true });
  if (!dossier) return res.status(404).json({ erreur: 'Patient introuvable' });
  res.json(dossier);
}));

// Vue patient : son propre dossier, uniquement les notes partagées
router.get('/moi/dossier', patientSeulement, route(async (req, res) => {
  const dossier = await chargerDossier(req.utilisateur.id, { notesVisiblesSeulement: true });
  if (!dossier) return res.status(404).json({ erreur: 'Dossier introuvable' });
  res.json(dossier);
}));

// ---------------------------------------------------------------------
// Changement de statut d'une étape : a_venir -> en_cours -> realisee
// Terminer une étape démarre la suivante. Une seule étape en cours à la fois.
// ---------------------------------------------------------------------
router.patch('/patients/:id/etapes/:idEtape', praticienSeulement, route(async (req, res) => {
  const idPatient = entier(req.params.id);
  const idEtape = entier(req.params.idEtape);
  const { statut } = req.body || {};
  if (!idPatient || !idEtape || !['en_cours', 'realisee'].includes(statut)) {
    return res.status(400).json({ erreur: 'Requête invalide' });
  }

  const cx = await pool.getConnection();
  try {
    await cx.beginTransaction();
    const [lignes] = await cx.query(
      `SELECT av.statut, e.position, e.id_parcours AS idParcours
         FROM avancement av JOIN etape e ON e.id_etape = av.id_etape
        WHERE av.id_patient = ? AND av.id_etape = ? FOR UPDATE`, [idPatient, idEtape]);
    const etape = lignes[0];
    if (!etape) {
      await cx.rollback();
      return res.status(404).json({ erreur: 'Étape introuvable pour ce patient' });
    }

    const autorisee = (etape.statut === 'a_venir' && statut === 'en_cours')
      || (etape.statut === 'en_cours' && statut === 'realisee');
    if (!autorisee) {
      await cx.rollback();
      return res.status(409).json({ erreur: `Transition impossible : ${etape.statut} vers ${statut}` });
    }

    if (statut === 'en_cours') {
      const [[{ total }]] = await cx.query(
        "SELECT COUNT(*) AS total FROM avancement WHERE id_patient = ? AND statut = 'en_cours'", [idPatient]);
      if (total > 0) {
        await cx.rollback();
        return res.status(409).json({ erreur: 'Une autre étape est déjà en cours' });
      }
      await cx.query('UPDATE avancement SET statut = ? WHERE id_patient = ? AND id_etape = ?',
        ['en_cours', idPatient, idEtape]);
    } else {
      await cx.query('UPDATE avancement SET statut = ?, date_realisation = ? WHERE id_patient = ? AND id_etape = ?',
        ['realisee', new Date(), idPatient, idEtape]);
      await cx.query(
        `UPDATE avancement av JOIN etape e ON e.id_etape = av.id_etape
            SET av.statut = 'en_cours'
          WHERE av.id_patient = ? AND e.id_parcours = ? AND e.position = ? AND av.statut = 'a_venir'`,
        [idPatient, etape.idParcours, etape.position + 1]);
    }
    await cx.commit();
    res.json({ statut });
  } catch (e) {
    await cx.rollback();
    throw e;
  } finally {
    cx.release();
  }
}));

// ---------------------------------------------------------------------
// Planifier une séance (le praticien connecté en est le praticien)
// ---------------------------------------------------------------------
router.post('/patients/:id/seances', praticienSeulement, route(async (req, res) => {
  const idPatient = entier(req.params.id);
  const { dateHeure, idEtape } = req.body || {};
  const date = new Date(dateHeure);
  if (!idPatient || typeof dateHeure !== 'string' || Number.isNaN(date.getTime()) || date < new Date()) {
    return res.status(400).json({ erreur: 'Date invalide (elle doit être dans le futur)' });
  }
  if (idEtape !== undefined && idEtape !== null && !entier(idEtape)) {
    return res.status(400).json({ erreur: 'Étape invalide' });
  }

  const [patients] = await pool.query('SELECT 1 FROM patient WHERE id_utilisateur = ?', [idPatient]);
  if (!patients[0]) return res.status(404).json({ erreur: 'Patient introuvable' });
  if (idEtape) {
    const [etapes] = await pool.query('SELECT 1 FROM avancement WHERE id_patient = ? AND id_etape = ?', [idPatient, idEtape]);
    if (!etapes[0]) return res.status(400).json({ erreur: 'Étape hors du parcours du patient' });
  }

  const [resultat] = await pool.query(
    'INSERT INTO seance (id_patient, id_praticien, id_etape, date_heure, statut) VALUES (?, ?, ?, ?, ?)',
    [idPatient, req.utilisateur.id, idEtape || null, date, 'prevue']
  );
  res.status(201).json({ id: resultat.insertId });
}));

// ---------------------------------------------------------------------
// Ajouter une note de suivi
// ---------------------------------------------------------------------
router.post('/patients/:id/notes', praticienSeulement, route(async (req, res) => {
  const idPatient = entier(req.params.id);
  const { contenu, visiblePatient = false } = req.body || {};
  const texte = typeof contenu === 'string' ? contenu.trim() : '';
  if (!idPatient || texte.length < 1 || texte.length > 2000 || typeof visiblePatient !== 'boolean') {
    return res.status(400).json({ erreur: 'Note invalide (1 à 2000 caractères)' });
  }

  const [patients] = await pool.query('SELECT 1 FROM patient WHERE id_utilisateur = ?', [idPatient]);
  if (!patients[0]) return res.status(404).json({ erreur: 'Patient introuvable' });

  const dateCreation = new Date();
  const [resultat] = await pool.query(
    'INSERT INTO note_suivi (id_patient, id_praticien, contenu, date_creation, visible_patient) VALUES (?, ?, ?, ?, ?)',
    [idPatient, req.utilisateur.id, texte, dateCreation, visiblePatient ? 1 : 0]
  );
  res.status(201).json({ id: resultat.insertId, contenu: texte, dateCreation, visiblePatient });
}));

module.exports = router;

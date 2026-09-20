// Remplit la base avec des données de démo fictives (npm run seed, depuis back/).
// Attention : vide toutes les tables.
if (require.main === module) require('dotenv').config(); // avant le require du pool (les tests chargent le leur)
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

const MOT_DE_PASSE_DEMO = 'Demo1234!';

// jour(-3) = il y a 3 jours ; jour(2, 18, 30) = dans 2 jours à 18 h 30
const jour = (decalage, h = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  d.setHours(h, min, 0, 0);
  return d;
};

// Parcours, étapes, praticiens
const NOM_PARCOURS = 'Préparation Marathon';

const ETAPES = [
  { libelle: 'Questionnaire préalable', specialite: null, praticien: null },
  { libelle: 'Bilan kiné', specialite: 'kinésithérapeute', praticien: 'kine' },
  { libelle: "Plan d'action", specialite: 'kinésithérapeute', praticien: 'kine' },
  { libelle: 'Analyse de foulée', specialite: 'kinésithérapeute', praticien: 'kine' },
  { libelle: 'Suivi coordonné', specialite: 'coordinateur de soins', praticien: 'coordinateur' },
];

const PRATICIENS = {
  medecin: { prenom: 'Camille', nom: 'Renaud', email: 'camille.renaud@example.com', specialite: 'médecin généraliste' },
  kine: { prenom: 'Sam', nom: 'Lefèvre', email: 'sam.lefevre@example.com', specialite: 'kinésithérapeute' },
  osteo: { prenom: 'Noa', nom: 'Bertrand', email: 'noa.bertrand@example.com', specialite: 'ostéopathe' },
  dieteticien: { prenom: 'Inès', nom: 'Moreau', email: 'ines.moreau@example.com', specialite: 'diététicien' },
  coordinateur: { prenom: 'Alex', nom: 'Garnier', email: 'alex.garnier@example.com', specialite: 'coordinateur de soins' },
};

// Questionnaires : valeurs par défaut, surchargées par patient
const TYPE_DEFAUT = {
  delai_bilan: 'des_que_possible',
  objectif_course: 'semi_marathon_trail',
  anciennete_course: 'six_mois_a_deux_ans',
  volume_km_semaine: 25,
  douleur_en_courant: 'aucune',
  douleur_localisee: '',
  arret_plus_2_semaines: 0,
  douleur_thoracique_effort: 'jamais',
  malaise_syncope: 0,
  palpitations: 'jamais',
  poids_kg: 70,
  taille_cm: 175,
  chirurgie: 0,
  medicaments_quotidiens: 0,
};

const AUTRES_DEFAUT = {
  antecedents_familiaux_cardiaques: 'non',
  essoufflement: 'jamais',
  hta_diabete_cholesterol: 'aucun',
  tabac: 'non',
  asthme: 'non',
  toux_seche: 'jamais',
  raideurs: [],
  semelles_orthopediques: 'non',
  anti_inflammatoires: 'jamais',
  autres_blessures: null,
  regime_alimentaire: 'aucun',
  fatigue_chronique: 'non',
  fracture_fatigue: false,
  autres_antecedents: null,
  activites_complementaires: [],
  troubles_digestifs: 'jamais',
  hydratation: 'plan_regulier',
  alcool: 'moins_1_par_semaine',
  heures_sommeil: 7,
  repos_au_reveil: 'tout_a_fait',
  impact_endormissement: 'jamais',
  jours_repos: 'un_par_semaine_min',
  rapport_course: ['plaisir'],
  reaction_blessure: 'frustre_adapte',
  autres_infos_praticiens: null,
};

const q = (typees = {}, autres = {}) => ({
  ...TYPE_DEFAUT,
  ...typees,
  autres: { ...AUTRES_DEFAUT, ...autres },
});

// Patients (realisees = étapes réalisées, 5 = parcours terminé)
const PATIENTS = [
  {
    prenom: 'Léa', nom: 'Martin', email: 'lea.martin@example.com', telephone: '0639980001',
    sexe: 'femme', age: 31, objectif: 'Marathon de Paris en 3 h 45', dateCible: '2027-04-11',
    realisees: 1, equipe: ['kine', 'coordinateur', 'medecin'],
    questionnaire: q(
        { volume_km_semaine: 35, douleur_en_courant: 'aggrave_en_courant', douleur_localisee: 'genou', poids_kg: 58, taille_cm: 167 },
        { raideurs: ['genoux', 'hanches'], activites_complementaires: ['renfo_ppg', 'velo_cyclisme'], rapport_course: ['equilibre', 'plaisir'], autres_blessures: 'Tendinite rotulienne gauche il y a deux ans.' }
    ),
    notes: [
      { auteur: 'kine', jours: 4, visible: true, contenu: 'Douleur au genou gauche en fin de sortie longue : à explorer lors du bilan. Notez quand elle apparaît.' },
      { auteur: 'coordinateur', jours: 2, visible: false, contenu: 'Patiente joignable en soirée. Bilan fixé, rappel envoyé.' },
    ],
    extraSeances: [],
  },
  {
    prenom: 'Karim', nom: 'Benali', email: 'karim.benali@example.com', telephone: '0639980002',
    sexe: 'homme', age: 38, objectif: 'Premier marathon, finir sans se blesser', dateCible: '2027-04-11',
    realisees: 2, equipe: ['kine', 'coordinateur', 'medecin'],
    questionnaire: q(
        { volume_km_semaine: 20, anciennete_course: 'moins_6_mois', douleur_en_courant: 'disparait_en_courant', douleur_localisee: 'tibia_mollet', poids_kg: 84, taille_cm: 180 },
        { activites_complementaires: ['natation'], hydratation: 'quelques_gorgees', troubles_digestifs: 'rarement', rapport_course: ['equilibre'] }
    ),
    notes: [
      { auteur: 'kine', jours: 8, visible: true, contenu: 'Bilan réalisé : bonne mobilité des chevilles, manque de force sur les fessiers. Plan d\'action en préparation.' },
      { auteur: 'medecin', jours: 5, visible: false, contenu: 'Rien à signaler à l\'examen. Suivi de la fatigue à la prochaine consultation.' },
    ],
    extraSeances: [],
  },
  {
    // Sans questionnaire : montre le bouton Evalandgo
    prenom: 'Sophie', nom: 'Lambert', email: 'sophie.lambert@example.com', telephone: '0639980003',
    sexe: 'femme', age: 45, objectif: 'Semi-marathon puis marathon', dateCible: '2027-05-16',
    realisees: 0, equipe: ['kine', 'coordinateur'], questionnaire: null,
    notes: [
      { auteur: 'coordinateur', jours: 1, visible: true, contenu: 'Bienvenue ! Merci de remplir votre questionnaire préalable avant votre bilan.' },
    ],
    extraSeances: [],
  },
  {
    prenom: 'Thomas', nom: 'Girard', email: 'thomas.girard@example.com', telephone: '0639980004',
    sexe: 'homme', age: 29, objectif: 'Marathon de Lyon en 3 h 30', dateCible: '2027-04-25',
    realisees: 3, equipe: ['kine', 'coordinateur', 'medecin', 'dieteticien'],
    questionnaire: q(
        { volume_km_semaine: 60, anciennete_course: 'plus_2_ans', poids_kg: 72, taille_cm: 183 },
        { activites_complementaires: ['renfo_ppg', 'yoga_mobilite'], rapport_course: ['equilibre', 'plaisir'], heures_sommeil: 8 }
    ),
    notes: [
      { auteur: 'kine', jours: 10, visible: true, contenu: 'Plan d\'action remis : deux séances de renforcement par semaine, à intégrer dès cette semaine.' },
      { auteur: 'dieteticien', jours: 3, visible: true, contenu: 'Prévoir une collation glucidique avant les sorties de plus d\'une heure.' },
    ],
    extraSeances: [{ praticien: 'dieteticien', jours: 5, h: 12, min: 30 }],
  },
  {
    prenom: 'Chloé', nom: 'Petit', email: 'chloe.petit@example.com', telephone: '0639980005',
    sexe: 'femme', age: 34, objectif: 'Marathon de Bordeaux, améliorer mon record', dateCible: '2027-05-09',
    realisees: 4, equipe: ['kine', 'coordinateur', 'medecin', 'dieteticien', 'osteo'],
    questionnaire: q(
        { volume_km_semaine: 45, anciennete_course: 'plus_2_ans', douleur_en_courant: 'disparait_en_courant', douleur_localisee: 'dos_lombaire', poids_kg: 61, taille_cm: 170 },
        { tabac: 'arret_recent', regime_alimentaire: 'vegetarien', fracture_fatigue: true, raideurs: ['bas_du_dos'], activites_complementaires: ['renfo_ppg', 'natation'], rapport_course: ['equilibre', 'stress'] }
    ),
    notes: [
      { auteur: 'coordinateur', jours: 6, visible: true, contenu: 'Suivi mis en place : point mensuel avec toute l\'équipe.' },
      { auteur: 'osteo', jours: 2, visible: false, contenu: 'Légère raideur lombaire, à surveiller après les longues sorties.' },
    ],
    extraSeances: [{ praticien: 'osteo', jours: 4, h: 17, min: 0 }],
  },
  {
    prenom: 'Hugo', nom: 'Roux', email: 'hugo.roux@example.com', telephone: '0639980006',
    sexe: 'homme', age: 52, objectif: 'Reprendre la course après une blessure', dateCible: '2027-06-13',
    realisees: 1, equipe: ['kine', 'coordinateur', 'medecin'],
    questionnaire: q(
        { objectif_course: 'reprise_apres_blessure', anciennete_course: 'plus_2_ans', volume_km_semaine: 10, douleur_en_courant: 'empeche_de_courir', douleur_localisee: 'hanche_bassin,dos_lombaire', arret_plus_2_semaines: 1, chirurgie: 1, poids_kg: 91, taille_cm: 178 },
        { anti_inflammatoires: 'regulierement', fatigue_chronique: 'un_peu', raideurs: ['hanches', 'bas_du_dos'], autres_antecedents: 'Opération du ménisque en 2019.', reaction_blessure: 'anxieux', rapport_course: ['stress'] }
    ),
    notes: [
      { auteur: 'kine', jours: 3, visible: false, contenu: 'Douleur importante à la hanche, arrêt de course de plus de deux semaines. À discuter avec le médecin avant le bilan.' },
      { auteur: 'medecin', jours: 1, visible: true, contenu: 'Repos de course conseillé jusqu\'au bilan. Marche et vélo restent possibles.' },
    ],
    extraSeances: [{ praticien: 'medecin', jours: 1, h: 9, min: 0 }],
  },
  {
    prenom: 'Emma', nom: 'Faure', email: 'emma.faure@example.com', telephone: '0639980007',
    sexe: 'femme', age: 27, objectif: 'Marathon de Nantes, objectif atteint', dateCible: '2026-10-18',
    realisees: 5, equipe: ['kine', 'coordinateur', 'medecin', 'dieteticien', 'osteo'],
    questionnaire: q(
        { volume_km_semaine: 55, anciennete_course: 'plus_2_ans', poids_kg: 55, taille_cm: 165 },
        { activites_complementaires: ['renfo_ppg', 'velo_cyclisme', 'yoga_mobilite'], rapport_course: ['equilibre', 'plaisir'], heures_sommeil: 8 }
    ),
    notes: [
      { auteur: 'coordinateur', jours: 9, visible: true, contenu: 'Parcours terminé, bilan final remis. Félicitations pour votre engagement.' },
    ],
    extraSeances: [],
  },
  {
    prenom: 'Nathan', nom: 'Blanc', email: 'nathan.blanc@example.com', telephone: '0639980008',
    sexe: 'homme', age: 41, objectif: 'Marathon de Paris, reprise du sport après plusieurs années', dateCible: '2027-04-11',
    realisees: 2, equipe: ['kine', 'coordinateur', 'medecin'],
    questionnaire: q(
        { anciennete_course: 'moins_6_mois', volume_km_semaine: 15, douleur_thoracique_effort: 'une_fois', palpitations: 'rarement', medicaments_quotidiens: 1, poids_kg: 88, taille_cm: 181 },
        { antecedents_familiaux_cardiaques: 'oui', hta_diabete_cholesterol: 'hta', essoufflement: 'parfois', rapport_course: ['equilibre'] }
    ),
    notes: [
      { auteur: 'medecin', jours: 6, visible: false, contenu: 'Palpitations rares et une douleur thoracique à l\'effort signalées : avis cardiologique demandé avant de poursuivre un entraînement intensif.' },
      { auteur: 'kine', jours: 4, visible: true, contenu: 'Bilan réalisé, plan d\'action à valider après l\'avis du médecin.' },
    ],
    extraSeances: [{ praticien: 'medecin', jours: 3, h: 11, min: 0 }],
  },
];

// Insertion
const TABLES = [
  'note_suivi', 'seance', 'avancement', 'questionnaire', 'patient_praticien',
  'patient', 'praticien', 'utilisateur', 'etape', 'parcours',
];

// ?? = identifiant, ? = valeurs (requêtes paramétrées)
const inserer = async (cx, table, ligne) => {
  const [res] = await cx.query('INSERT INTO ?? SET ?', [table, ligne]);
  return res.insertId;
};

async function seed() {
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
  const cx = await pool.getConnection();
  try {
    // TRUNCATE avant la transaction (il valide implicitement)
    await cx.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of TABLES) await cx.query('TRUNCATE TABLE ??', [t]);
    await cx.query('SET FOREIGN_KEY_CHECKS = 1');

    await cx.beginTransaction();

    const idParcours = await inserer(cx, 'parcours', { nom: NOM_PARCOURS });

    const idEtapes = [];
    for (const [i, e] of ETAPES.entries()) {
      idEtapes.push(await inserer(cx, 'etape', {
        id_parcours: idParcours, position: i + 1, libelle: e.libelle, specialite_attendue: e.specialite,
      }));
    }

    const idPraticiens = {};
    for (const [cle, p] of Object.entries(PRATICIENS)) {
      const id = await inserer(cx, 'utilisateur', {
        email: p.email, mot_de_passe_hash: hash, role: 'praticien', prenom: p.prenom, nom: p.nom,
      });
      await inserer(cx, 'praticien', { id_utilisateur: id, specialite: p.specialite });
      idPraticiens[cle] = id;
    }

    for (const p of PATIENTS) {
      const id = await inserer(cx, 'utilisateur', {
        email: p.email, mot_de_passe_hash: hash, role: 'patient', prenom: p.prenom, nom: p.nom,
      });
      await inserer(cx, 'patient', {
        id_utilisateur: id, id_parcours: idParcours, telephone: p.telephone, sexe: p.sexe,
        age: p.age, objectif: p.objectif, date_cible: p.dateCible,
      });
      for (const cle of p.equipe) {
        await inserer(cx, 'patient_praticien', { id_patient: id, id_praticien: idPraticiens[cle] });
      }

      // Avancement et séances
      const n = p.realisees;
      for (const [i, e] of ETAPES.entries()) {
        const statut = i < n ? 'realisee' : i === n ? 'en_cours' : 'a_venir';
        const dateRealisation = jour(-((n - i) * 9), 17, 30);
        await inserer(cx, 'avancement', {
          id_patient: id, id_etape: idEtapes[i], statut,
          date_realisation: statut === 'realisee' ? dateRealisation : null,
        });
        if (e.praticien && statut !== 'a_venir') {
          await inserer(cx, 'seance', {
            id_patient: id, id_praticien: idPraticiens[e.praticien], id_etape: idEtapes[i],
            date_heure: statut === 'realisee' ? dateRealisation : jour(2, 18, 30),
            statut: statut === 'realisee' ? 'realisee' : 'prevue',
          });
        }
      }
      for (const s of p.extraSeances) {
        await inserer(cx, 'seance', {
          id_patient: id, id_praticien: idPraticiens[s.praticien], id_etape: null,
          date_heure: jour(s.jours, s.h, s.min), statut: 'prevue',
        });
      }

      for (const note of p.notes) {
        await inserer(cx, 'note_suivi', {
          id_patient: id, id_praticien: idPraticiens[note.auteur], contenu: note.contenu,
          date_creation: jour(-note.jours, 9, 15), visible_patient: note.visible ? 1 : 0,
        });
      }

      if (p.questionnaire) {
        const { autres, ...typees } = p.questionnaire;
        const dateQuestionnaire = jour(-(n * 9 + 3), 20, 5);
        await inserer(cx, 'questionnaire', {
          id_patient: id, date_soumission: dateQuestionnaire, consentement_rgpd: 1,
          date_consentement: dateQuestionnaire, ...typees, autres_reponses: JSON.stringify(autres),
        });
      }
    }

    await cx.commit();
    return { praticiens: Object.keys(PRATICIENS).length, patients: PATIENTS.length };
  } catch (e) {
    await cx.rollback();
    throw e;
  } finally {
    cx.release();
  }
}

module.exports = { seed, MOT_DE_PASSE_DEMO };

// npm run seed
if (require.main === module) {
  seed()
      .then(({ praticiens, patients }) => {
        console.log(`Seed terminé : ${praticiens} praticiens, ${patients} patients.`);
        console.log(`Mot de passe de tous les comptes de démo : ${MOT_DE_PASSE_DEMO}`);
      })
      .catch((e) => {
        console.error('Échec du seed :', e.message);
        process.exitCode = 1;
      })
      .finally(() => pool.end());
}
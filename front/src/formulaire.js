export const URL_EVALANDGO = 'https://app.evalandgo.com/f/426451/4qahxuPxf61tnQW9xLHZKs';

const oui = { oui: 'Oui', non: 'Non' };
const frequence = { jamais: 'Jamais', parfois: 'Parfois', souvent: 'Souvent' };

// Clés = colonnes de la table questionnaire et clés du JSON autres_reponses
export const SECTIONS = [
  {
    titre: 'Course à pied',
    questions: [
      { cle: 'objectif_course', libelle: 'Objectif actuel', type: 'choix', options: {
        plaisir_sante: 'Courir pour le plaisir / la santé', course_5_10k: 'Préparer une course (5K-10K)',
        semi_marathon_trail: 'Préparer un semi-marathon, marathon ou trail', reprise_apres_blessure: 'Reprendre après une blessure ou un arrêt' } },
      { cle: 'anciennete_course', libelle: 'Course régulière depuis', type: 'choix', options: {
        moins_6_mois: 'Moins de 6 mois', six_mois_a_deux_ans: '6 mois à 2 ans', plus_2_ans: 'Plus de 2 ans' } },
      { cle: 'volume_km_semaine', libelle: "Volume d'entraînement", type: 'nombre', unite: 'km/semaine' },
      { cle: 'activites_complementaires', libelle: 'Renforcement ou entraînements croisés', type: 'multiple', vide: 'Aucun', options: {
        renfo_ppg: 'Renforcement musculaire / PPG', velo_cyclisme: 'Vélo / Cyclisme', natation: 'Natation', yoga_mobilite: 'Yoga / Mobilité' } },
      { cle: 'rapport_course', libelle: 'Rapport à la course en ce moment', type: 'multiple', vide: 'Non renseigné', options: {
        equilibre: "C'est mon équilibre et mon sas de décompression", plaisir: "C'est un plaisir mais je n'en fais pas une obsession",
        stress: "C'est une source de stress si je manque un entraînement", obligation_poids_image: 'Je cours par obligation pour contrôler mon poids / mon image' } },
      { cle: 'reaction_blessure', libelle: 'Réaction si blessé(e) pendant 1 mois', type: 'choix', options: {
        frustre_adapte: "Frustré(e) mais je m'adapterais", anxieux: 'Très anxieux(se) et de mauvaise humeur', catastrophique: 'Catastrophique pour ma santé mentale' } },
    ],
  },
  {
    titre: 'Douleurs et blessures',
    questions: [
      { cle: 'douleur_en_courant', libelle: 'Douleur ou gêne en courant', type: 'choix', options: {
        aucune: 'Aucune douleur', disparait_en_courant: 'Oui, mais elle disparaît en courant',
        aggrave_en_courant: "Oui, elle s'aggrave en courant", empeche_de_courir: "Oui, elle m'empêche de courir" } },
      { cle: 'douleur_localisee', libelle: 'Localisation de la douleur', type: 'multiple', vide: 'Aucune', options: {
        pied_cheville: 'Pied / cheville', tibia_mollet: 'Tibia / mollet', genou: 'Genou', cuisse_ischio: 'Cuisse / ischio-jambiers',
        hanche_bassin: 'Hanche / bassin', dos_lombaire: 'Dos lombaire', autre: 'Autre' } },
      { cle: 'arret_plus_2_semaines', libelle: 'Arrêt de plus de 2 semaines (12 derniers mois)', type: 'booleen' },
      { cle: 'raideurs', libelle: 'Raideurs ou limitations de mouvement', type: 'multiple', vide: 'Aucune', options: {
        chevilles: 'Chevilles', hanches: 'Hanches', bas_du_dos: 'Bas du dos', genoux: 'Genoux', epaules_haut_du_dos: 'Épaules / haut du dos' } },
      { cle: 'semelles_orthopediques', libelle: 'Semelles orthopédiques', type: 'choix', options: { tout_le_temps: 'Oui, tout le temps', parfois: 'Parfois', non: 'Non' } },
      { cle: 'anti_inflammatoires', libelle: 'Anti-inflammatoires ou antalgiques', type: 'choix', options: {
        jamais: 'Jamais', exceptionnellement: 'Exceptionnellement', regulierement: 'Régulièrement' } },
      { cle: 'autres_blessures', libelle: 'Autres antécédents de blessures', type: 'texte' },
      { cle: 'fracture_fatigue', libelle: 'Fracture de fatigue', type: 'booleen' },
    ],
  },
  {
    titre: 'Cardiovasculaire et respiratoire',
    questions: [
      { cle: 'antecedents_familiaux_cardiaques', libelle: 'Antécédents familiaux de maladie cardiaque', type: 'choix', options: { ...oui, ne_sait_pas: 'Je ne sais pas' } },
      { cle: 'douleur_thoracique_effort', libelle: "Douleur ou oppression thoracique à l'effort", type: 'choix', options: {
        jamais: 'Jamais', une_fois: 'Une fois', plusieurs_fois: 'Plusieurs fois' } },
      { cle: 'malaise_syncope', libelle: 'Malaise, syncope ou « voile noir » à l\'effort', type: 'booleen' },
      { cle: 'palpitations', libelle: 'Palpitations', type: 'choix', options: { jamais: 'Jamais', rarement: 'Rarement' } },
      { cle: 'essoufflement', libelle: 'Essoufflement disproportionné', type: 'choix', options: frequence },
      { cle: 'hta_diabete_cholesterol', libelle: 'HTA, diabète ou cholestérol élevé', type: 'choix', options: {
        aucun: 'Aucun', hta: 'HTA', diabete: 'Diabète', cholesterol_eleve: 'Cholestérol élevé' } },
      { cle: 'tabac', libelle: 'Tabac ou cigarette électronique', type: 'choix', options: { non: 'Non', arret_recent: "J'ai arrêté récemment" } },
      { cle: 'asthme', libelle: 'Asthme ou Ventoline', type: 'choix', options: {
        asthme_connu: 'Oui, asthme connu', ventoline_seulement: 'Seulement déjà eu besoin de Ventoline', non: 'Non' } },
      { cle: 'toux_seche', libelle: 'Toux sèche pendant ou après les sorties', type: 'choix', options: {
        jamais: 'Jamais', parfois: 'Parfois', systematiquement: 'Systématiquement' } },
    ],
  },
  {
    titre: 'Santé générale',
    questions: [
      { cle: 'poids_kg', libelle: 'Poids', type: 'nombre', unite: 'kg' },
      { cle: 'taille_cm', libelle: 'Taille', type: 'nombre', unite: 'cm' },
      { cle: 'regime_alimentaire', libelle: 'Régime alimentaire', type: 'choix', options: {
        aucun: 'Aucun', vegetarien: 'Végétarien', vegan: 'Vegan', sans_gluten: 'Sans gluten', sans_lactose: 'Sans lactose', low_carb: 'Low-carb' } },
      { cle: 'fatigue_chronique', libelle: 'Fatigue chronique ou baisse de performances', type: 'choix', options: {
        non: 'Non', un_peu: 'Un peu, depuis quelques semaines', oui_plus_dun_mois: "Oui, depuis plus d'un mois" } },
      { cle: 'chirurgie', libelle: 'Interventions chirurgicales', type: 'booleen' },
      { cle: 'autres_antecedents', libelle: 'Autres antécédents médicaux', type: 'texte' },
      { cle: 'medicaments_quotidiens', libelle: 'Médicaments au quotidien', type: 'booleen' },
    ],
  },
  {
    titre: 'Nutrition, sommeil et récupération',
    questions: [
      { cle: 'troubles_digestifs', libelle: 'Troubles digestifs en course', type: 'choix', options: {
        jamais: 'Jamais', rarement: 'Rarement', frequemment: 'Fréquemment', chaque_sortie: 'À chaque sortie' } },
      { cle: 'hydratation', libelle: "Hydratation pendant l'effort", type: 'choix', options: {
        aucune: 'Je ne bois pas', quelques_gorgees: "Quelques gorgées quand j'y pense", plan_regulier: "Plan d'hydratation régulier" } },
      { cle: 'alcool', libelle: 'Boissons alcoolisées', type: 'choix', options: {
        jamais: 'Jamais', moins_1_par_semaine: "Moins d'une fois par semaine", deux_trois_par_semaine: '2 à 3 fois par semaine', quotidien: 'Quotidiennement' } },
      { cle: 'heures_sommeil', libelle: 'Sommeil moyen', type: 'nombre', unite: 'h par nuit' },
      { cle: 'repos_au_reveil', libelle: 'Reposé(e) au réveil', type: 'choix', options: {
        tout_a_fait: 'Tout à fait', moyennement: 'Moyennement', souvent_epuise: 'Je me réveille souvent épuisé(e)' } },
      { cle: 'impact_endormissement', libelle: 'Entraînements tardifs et endormissement', type: 'choix', options: {
        jamais: 'Jamais', parfois: 'Parfois', souvent: 'Souvent', presque_toujours: 'Presque toujours' } },
      { cle: 'jours_repos', libelle: 'Jours de repos complets', type: 'choix', options: {
        un_par_semaine_min: 'Oui, au moins 1 par semaine', rarement: 'Rarement', jamais: 'Jamais' } },
    ],
  },
  {
    titre: 'Organisation',
    questions: [
      { cle: 'delai_bilan', libelle: 'Délai souhaité pour le bilan kiné', type: 'choix', options: {
        des_que_possible: 'Dès que possible', deux_a_trois_semaines: 'Dans 2 à 3 semaines', a_recontacter: 'Je ne sais pas encore, recontactez-moi' } },
      { cle: 'autres_infos_praticiens', libelle: 'Autres informations pour les praticiens', type: 'texte' },
    ],
  },
];

export const QUESTIONS = Object.fromEntries(SECTIONS.flatMap((s) => s.questions.map((q) => [q.cle, q])));

// Réponses affichées en évidence dans la fiche patient
export const INFOS_CLES = [
  'objectif_course', 'anciennete_course', 'volume_km_semaine', 'douleur_en_courant', 'douleur_localisee',
  'arret_plus_2_semaines', 'douleur_thoracique_effort', 'malaise_syncope', 'palpitations',
  'poids_kg', 'taille_cm', 'chirurgie', 'medicaments_quotidiens',
];

export function formaterReponse(question, valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return 'Non renseigné';
  switch (question.type) {
    case 'booleen': return valeur ? 'Oui' : 'Non';
    case 'nombre': return `${valeur} ${question.unite}`;
    case 'multiple': return valeur.length === 0 ? question.vide : valeur.map((v) => question.options[v] ?? v).join(', ');
    case 'choix': return question.options[valeur] ?? valeur;
    default: return String(valeur);
  }
}

// Réponses qui méritent l'attention du praticien (choix produit, à valider avec l'équipe médicale)
const REGLES_ATTENTION = [
  { cle: 'douleur_thoracique_effort', signale: (v) => Boolean(v) && v !== 'jamais' },
  { cle: 'malaise_syncope', signale: (v) => v === true },
  { cle: 'palpitations', signale: (v) => Boolean(v) && v !== 'jamais' },
  { cle: 'douleur_en_courant', signale: (v) => v === 'empeche_de_courir' },
  { cle: 'arret_plus_2_semaines', signale: (v) => v === true },
];

export const pointsAttention = (reponses) =>
  REGLES_ATTENTION
    .filter((r) => r.signale(reponses[r.cle]))
    .map((r) => ({ cle: r.cle, libelle: QUESTIONS[r.cle].libelle, valeur: formaterReponse(QUESTIONS[r.cle], reponses[r.cle]) }));

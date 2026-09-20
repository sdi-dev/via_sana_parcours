-- =====================================================================
-- Via Sana : suivi de parcours patient (parcours « Préparation Marathon »)
-- MySQL 8.0.16+ (les contraintes CHECK ne sont appliquées qu'à partir de là)
-- Convention : tables et colonnes en français, snake_case, sans accents.
-- Les ENUM stockent des codes ; les libellés affichés vivent dans le front.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. Comptes
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
  id_utilisateur    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email             VARCHAR(254) NOT NULL,
  mot_de_passe_hash VARCHAR(255) NOT NULL,          -- hash bcrypt, jamais le mot de passe
  role              ENUM('patient', 'praticien') NOT NULL,
  prenom            VARCHAR(100) NOT NULL,
  nom               VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_utilisateur),
  UNIQUE KEY uq_utilisateur_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. Parcours et étapes types
-- ---------------------------------------------------------------------
CREATE TABLE parcours (
  id_parcours INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_parcours),
  UNIQUE KEY uq_parcours_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE etape (
  id_etape            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_parcours         INT UNSIGNED NOT NULL,
  position            TINYINT UNSIGNED NOT NULL,     -- ordre dans le parcours
  libelle             VARCHAR(100) NOT NULL,
  specialite_attendue VARCHAR(50) NULL,              -- NULL pour l'étape questionnaire
  PRIMARY KEY (id_etape),
  UNIQUE KEY uq_etape_position (id_parcours, position),
  CONSTRAINT fk_etape_parcours FOREIGN KEY (id_parcours) REFERENCES parcours (id_parcours)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. Patients et praticiens (spécialisations d'utilisateur)
--    Règle applicative : id_utilisateur doit avoir le bon rôle (seed / API).
-- ---------------------------------------------------------------------
CREATE TABLE patient (
  id_utilisateur INT UNSIGNED NOT NULL,
  id_parcours    INT UNSIGNED NOT NULL,
  telephone      VARCHAR(20) NOT NULL,
  sexe           ENUM('femme', 'homme', 'autre') NOT NULL,
  age            TINYINT UNSIGNED NOT NULL,          -- âge déclaré (hypothèse : 14 à 99)
  objectif       VARCHAR(255) NULL,
  date_cible     DATE NULL,
  PRIMARY KEY (id_utilisateur),
  CONSTRAINT ck_patient_age CHECK (age BETWEEN 14 AND 99),
  CONSTRAINT fk_patient_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_patient_parcours FOREIGN KEY (id_parcours) REFERENCES parcours (id_parcours)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE praticien (
  id_utilisateur INT UNSIGNED NOT NULL,
  specialite     VARCHAR(50) NOT NULL,               -- dont « coordinateur de soins »
  PRIMARY KEY (id_utilisateur),
  CONSTRAINT fk_praticien_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Praticiens impliqués auprès d'un patient
CREATE TABLE patient_praticien (
  id_patient   INT UNSIGNED NOT NULL,
  id_praticien INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_patient, id_praticien),
  CONSTRAINT fk_pp_patient FOREIGN KEY (id_patient)
    REFERENCES patient (id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_pp_praticien FOREIGN KEY (id_praticien)
    REFERENCES praticien (id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. Avancement : une ligne par patient et par étape de son parcours
--    (créées à l'inscription du patient, statut initial « a_venir »)
-- ---------------------------------------------------------------------
CREATE TABLE avancement (
  id_patient       INT UNSIGNED NOT NULL,
  id_etape         INT UNSIGNED NOT NULL,
  statut           ENUM('a_venir', 'en_cours', 'realisee') NOT NULL DEFAULT 'a_venir',
  date_realisation DATETIME NULL,
  PRIMARY KEY (id_patient, id_etape),
  KEY idx_avancement_etape_statut (id_etape, statut),  -- filtres par étape et statut
  CONSTRAINT ck_avancement_date CHECK (statut <> 'realisee' OR date_realisation IS NOT NULL),
  CONSTRAINT fk_avancement_patient FOREIGN KEY (id_patient)
    REFERENCES patient (id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_avancement_etape FOREIGN KEY (id_etape) REFERENCES etape (id_etape)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. Séances et notes de suivi
-- ---------------------------------------------------------------------
CREATE TABLE seance (
  id_seance    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_patient   INT UNSIGNED NOT NULL,
  id_praticien INT UNSIGNED NOT NULL,
  id_etape     INT UNSIGNED NULL,                    -- étape à laquelle la séance se rattache
  date_heure   DATETIME NOT NULL,
  statut       ENUM('prevue', 'realisee', 'annulee') NOT NULL DEFAULT 'prevue',
  PRIMARY KEY (id_seance),
  KEY idx_seance_patient_date (id_patient, date_heure),
  KEY idx_seance_praticien_date (id_praticien, date_heure),
  CONSTRAINT fk_seance_patient FOREIGN KEY (id_patient)
    REFERENCES patient (id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_seance_praticien FOREIGN KEY (id_praticien)
    REFERENCES praticien (id_utilisateur),
  CONSTRAINT fk_seance_etape FOREIGN KEY (id_etape) REFERENCES etape (id_etape)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE note_suivi (
  id_note         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_patient      INT UNSIGNED NOT NULL,
  id_praticien    INT UNSIGNED NOT NULL,             -- auteur
  contenu         VARCHAR(2000) NOT NULL,
  date_creation   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible_patient BOOLEAN NOT NULL DEFAULT FALSE,    -- partagée avec le patient ou non
  PRIMARY KEY (id_note),
  KEY idx_note_patient_date (id_patient, date_creation),
  CONSTRAINT fk_note_patient FOREIGN KEY (id_patient)
    REFERENCES patient (id_utilisateur) ON DELETE CASCADE,
  CONSTRAINT fk_note_praticien FOREIGN KEY (id_praticien)
    REFERENCES praticien (id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. Questionnaire préalable (un seul par patient, soumis en une fois)
--    Colonnes typées : les informations clés affichées et filtrées dans la
--    fiche patient. Colonnes NOT NULL = questions obligatoires (*).
--    Toutes les autres réponses : objet JSON, clés = identifiants de la
--    configuration du formulaire (validées par l'API), valeurs = codes des
--    options (tableau pour les choix multiples).
-- ---------------------------------------------------------------------
CREATE TABLE questionnaire (
  id_questionnaire  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_patient        INT UNSIGNED NOT NULL,
  date_soumission   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consentement_rgpd BOOLEAN NOT NULL,
  date_consentement DATETIME NOT NULL,
  delai_bilan       ENUM('des_que_possible', 'deux_a_trois_semaines', 'a_recontacter') NOT NULL,

  -- Course à pied
  objectif_course   ENUM('plaisir_sante', 'course_5_10k', 'semi_marathon_trail', 'reprise_apres_blessure') NOT NULL,
  anciennete_course ENUM('moins_6_mois', 'six_mois_a_deux_ans', 'plus_2_ans') NOT NULL,
  volume_km_semaine TINYINT UNSIGNED NULL,           -- curseur 0 à 100, non obligatoire

  -- Douleurs et blessures
  douleur_en_courant    ENUM('aucune', 'disparait_en_courant', 'aggrave_en_courant', 'empeche_de_courir') NOT NULL,
  douleur_localisee     SET('pied_cheville', 'tibia_mollet', 'genou', 'cuisse_ischio', 'hanche_bassin', 'dos_lombaire', 'autre') NOT NULL DEFAULT '',  -- vide = pas de douleur localisée
  arret_plus_2_semaines BOOLEAN NOT NULL,

  -- Alertes cardiovasculaires
  douleur_thoracique_effort ENUM('jamais', 'une_fois', 'plusieurs_fois') NOT NULL,
  malaise_syncope           BOOLEAN NOT NULL,
  palpitations              ENUM('jamais', 'rarement') NOT NULL,   -- options à compléter

  -- Santé générale
  poids_kg               SMALLINT UNSIGNED NOT NULL,
  taille_cm              SMALLINT UNSIGNED NOT NULL,
  chirurgie              BOOLEAN NOT NULL,
  medicaments_quotidiens BOOLEAN NOT NULL,

  -- Toutes les autres réponses du formulaire
  autres_reponses JSON NOT NULL,

  PRIMARY KEY (id_questionnaire),
  UNIQUE KEY uq_questionnaire_patient (id_patient),
  CONSTRAINT ck_q_consentement CHECK (consentement_rgpd = 1),
  CONSTRAINT ck_q_poids CHECK (poids_kg BETWEEN 20 AND 300),
  CONSTRAINT ck_q_taille CHECK (taille_cm BETWEEN 100 AND 250),
  CONSTRAINT ck_q_volume CHECK (volume_km_semaine IS NULL OR volume_km_semaine <= 100),
  CONSTRAINT ck_q_autres_json CHECK (JSON_TYPE(autres_reponses) = 'OBJECT'),
  CONSTRAINT fk_q_patient FOREIGN KEY (id_patient)
    REFERENCES patient (id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

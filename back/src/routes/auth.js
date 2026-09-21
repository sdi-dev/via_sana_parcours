const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authentifier } = require('../middlewares/auth');
const limite = require('../middlewares/limiteConnexion');

const router = express.Router();

// Comparé quand l'email est inconnu, pour que la durée de réponse ne le révèle pas
// La spécialité n'est renvoyée que pour un praticien
const profil = ({ specialite, ...reste }) => (specialite ? { ...reste, specialite } : reste);

const HASH_FACTICE = bcrypt.hashSync('mot-de-passe-factice', 10);

router.post('/login', async (req, res) => {
    const { email, motDePasse } = req.body || {};
    // bcrypt ignore ce qui dépasse 72 caractères : on borne les entrées
    if (typeof email !== 'string' || typeof motDePasse !== 'string' || email.length > 254 || motDePasse.length > 72) {
        return res.status(400).json({ erreur: 'Requête invalide' });
    }
    const emailNormalise = email.trim().toLowerCase();
    const secondes = limite.attente(req.ip, emailNormalise);
    if (secondes) {
        const minutes = Math.ceil(secondes / 60);
        res.set('Retry-After', String(secondes));
        return res.status(429).json({ erreur: `Trop de tentatives échouées. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.` });
    }
    try {
        const [lignes] = await pool.query(
            `SELECT u.id_utilisateur, u.mot_de_passe_hash, u.role, u.prenom, u.nom, p.specialite
               FROM utilisateur u LEFT JOIN praticien p ON p.id_utilisateur = u.id_utilisateur
              WHERE u.email = ?`,
            [emailNormalise]
        );
        const u = lignes[0];
        const motDePasseValide = await bcrypt.compare(motDePasse, u ? u.mot_de_passe_hash : HASH_FACTICE);
        if (!u || !motDePasseValide) {
            // Même message dans les deux cas : on ne révèle pas si l'email existe
            limite.echec(req.ip, emailNormalise);
            return res.status(401).json({ erreur: 'Identifiants invalides' });
        }
        limite.reussite(req.ip, emailNormalise);
        const token = jwt.sign({ id: u.id_utilisateur, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            token,
            utilisateur: profil({ id: u.id_utilisateur, role: u.role, prenom: u.prenom, nom: u.nom, specialite: u.specialite }),
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// Qui est connecté ? Sert au front pour restaurer la session après un rechargement
router.get('/session', authentifier, async (req, res) => {
    try {
        const [lignes] = await pool.query(
            `SELECT u.id_utilisateur AS id, u.role, u.prenom, u.nom, p.specialite
               FROM utilisateur u LEFT JOIN praticien p ON p.id_utilisateur = u.id_utilisateur
              WHERE u.id_utilisateur = ?`,
            [req.utilisateur.id]
        );
        if (!lignes[0]) return res.status(401).json({ erreur: 'Session invalide' });
        res.json(profil(lignes[0]));
    } catch (e) {
        console.error(e);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;

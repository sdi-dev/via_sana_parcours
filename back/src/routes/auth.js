const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authentifier } = require('../middlewares/auth');

const router = express.Router();

// Comparé quand l'email est inconnu, pour que la durée de réponse ne le révèle pas
const HASH_FACTICE = bcrypt.hashSync('mot-de-passe-factice', 10);

router.post('/login', async (req, res) => {
    const { email, motDePasse } = req.body || {};
    // bcrypt ignore ce qui dépasse 72 caractères : on borne les entrées
    if (typeof email !== 'string' || typeof motDePasse !== 'string' || email.length > 254 || motDePasse.length > 72) {
        return res.status(400).json({ erreur: 'Requête invalide' });
    }
    try {
        const [lignes] = await pool.query(
            'SELECT id_utilisateur, mot_de_passe_hash, role, prenom, nom FROM utilisateur WHERE email = ?',
            [email.trim().toLowerCase()]
        );
        const u = lignes[0];
        const motDePasseValide = await bcrypt.compare(motDePasse, u ? u.mot_de_passe_hash : HASH_FACTICE);
        if (!u || !motDePasseValide) {
            // Même message dans les deux cas : on ne révèle pas si l'email existe
            return res.status(401).json({ erreur: 'Identifiants invalides' });
        }
        const token = jwt.sign({ id: u.id_utilisateur, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            token,
            utilisateur: { id: u.id_utilisateur, role: u.role, prenom: u.prenom, nom: u.nom },
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
            'SELECT id_utilisateur AS id, role, prenom, nom FROM utilisateur WHERE id_utilisateur = ?',
            [req.utilisateur.id]
        );
        if (!lignes[0]) return res.status(401).json({ erreur: 'Session invalide' });
        res.json(lignes[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;
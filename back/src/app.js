// L'application Express, sans app.listen : index.js la démarre, les tests l'importent.
// Les variables d'environnement doivent être chargées AVANT ce fichier (db.js les lit à l'import).
const path = require('path');
const express = require('express');
const pool = require('./db');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET manquant');

const app = express();
// Derrière le proxy de Render : req.ip doit être l'adresse du visiteur (utilisée par la limite de connexion)
app.set('trust proxy', 1);
app.use(express.json());

// Doit rester AVANT le 404 de /api, sinon /api/health renvoie « Page introuvable »
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ status: 'db_error' });
    }
});

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/patients'));
app.use('/api', (req, res) => res.status(404).json({ erreur: 'Page introuvable' }));

// Le front buildé, servi par Express
const dist = path.join(__dirname, '../../front/dist');
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((err, req, res, next) => {
    // JSON mal formé : c'est une erreur du client (400), pas du serveur (500)
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erreur: 'Requête invalide' });
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
});

module.exports = app;

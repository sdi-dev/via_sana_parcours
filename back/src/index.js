require('dotenv').config({ quiet: true })
const path = require('path');
const express = require('express');
const pool = require('./db'); // ton pool déjà configuré avec le SSL
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET manquant');

const app = express();
app.use(express.json());

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/patients'));
app.use('/api', (req, res) => res.status(404).json({ erreur: 'Page introuvable' }));


app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ status: 'db_error' });
    }
});

// Le front buildé, servi par Express
const dist = path.join(__dirname, '../../front/dist');
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
});

app.listen(process.env.PORT || 3000);
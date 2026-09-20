require('dotenv').config();
const path = require('path');
const express = require('express');
const pool = require('./db'); // ton pool déjà configuré avec le SSL

const app = express();
app.use(express.json());

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

app.listen(process.env.PORT || 3000);
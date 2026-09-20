const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const MOT_DE_PASSE = 'Demo1234!';
const PRATICIEN = 'sam.lefevre@example.com';       // kiné
const AUTRE_PRATICIEN = 'alex.garnier@example.com'; // coordinateur
const PATIENT = 'lea.martin@example.com';

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

async function connexion(email, motDePasse = MOT_DE_PASSE) {
  const r = await api().post('/api/login').send({ email, motDePasse });
  if (r.status !== 200) throw new Error(`Connexion impossible pour ${email} : ${r.status} ${JSON.stringify(r.body)}`);
  return { token: r.body.token, ...r.body.utilisateur, entetes: bearer(r.body.token) };
}

// Retrouve l'id d'un patient par son nom de famille (sans accent, donc sans surprise de collation)
async function idPatient(praticien, nom) {
  const r = await api().get('/api/patients').query({ q: nom }).set(praticien.entetes);
  if (r.body.length !== 1) throw new Error(`Patient « ${nom} » introuvable ou ambigu (${r.body.length})`);
  return r.body[0].id;
}

const dossier = async (praticien, id) => (await api().get(`/api/patients/${id}`).set(praticien.entetes)).body;

// Jeton forgé : par défaut signé avec le bon secret, mais on peut tout changer
const jeton = (charge = { id: 1, role: 'praticien' }, options = {}, secret = process.env.JWT_SECRET) =>
  jwt.sign(charge, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });

const dansNJours = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

module.exports = { api, bearer, connexion, idPatient, dossier, jeton, dansNJours, MOT_DE_PASSE, PRATICIEN, AUTRE_PRATICIEN, PATIENT };

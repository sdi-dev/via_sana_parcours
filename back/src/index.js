require('dotenv').config({ quiet: true }); // avant le require de l'app (le pool lit l'environnement)
const app = require('./app');

app.listen(process.env.PORT || 3000);
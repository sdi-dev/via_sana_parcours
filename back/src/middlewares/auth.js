const jwt = require('jsonwebtoken');

// Vérifie le jeton JWT (en-tête « Authorization: Bearer ... ») et renseigne req.utilisateur
function authentifier(req, res, next) {
    const [type, token] = (req.headers.authorization || '').split(' ');
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ erreur: 'Non authentifié' });
    }
    try {
        const { id, role } = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.utilisateur = { id, role };
        next();
    } catch {
        res.status(401).json({ erreur: 'Session invalide ou expirée' });
    }
}

// À placer après authentifier : exigerRole('praticien'), exigerRole('patient', 'praticien')...
const exigerRole = (...roles) => (req, res, next) =>
    roles.includes(req.utilisateur.role)
        ? next()
        : res.status(403).json({ erreur: 'Accès refusé' });

module.exports = { authentifier, exigerRole };
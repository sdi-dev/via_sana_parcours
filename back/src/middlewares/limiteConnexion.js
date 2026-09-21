// Limite les échecs de connexion : 3 échecs pour un même couple (IP, e-mail), puis blocage de 5 minutes.
// L'état est en mémoire : il est remis à zéro au redémarrage du serveur (instance unique).
const MAX_ECHECS = 3;
const DUREE_MS = 5 * 60 * 1000;
const MAX_ENTREES = 5000;

const etats = new Map(); // "ip|email" -> { echecs, debut, bloqueJusqua }
const cle = (ip, email) => `${ip}|${email}`;

// Évite qu'une série d'e-mails différents fasse grossir la mémoire sans limite
function nettoyer(maintenant) {
    if (etats.size < MAX_ENTREES) return;
    for (const [k, e] of etats) if (e.bloqueJusqua <= maintenant && maintenant - e.debut >= DUREE_MS) etats.delete(k);
    while (etats.size >= MAX_ENTREES) etats.delete(etats.keys().next().value);
}

// Secondes de blocage restantes (0 : connexion autorisée)
function attente(ip, email) {
    const maintenant = Date.now();
    const e = etats.get(cle(ip, email));
    return e && e.bloqueJusqua > maintenant ? Math.ceil((e.bloqueJusqua - maintenant) / 1000) : 0;
}

function echec(ip, email) {
    const maintenant = Date.now();
    let e = etats.get(cle(ip, email));
    if (!e || maintenant - e.debut >= DUREE_MS) {
        nettoyer(maintenant);
        e = { echecs: 0, debut: maintenant, bloqueJusqua: 0 };
        etats.set(cle(ip, email), e);
    }
    e.echecs += 1;
    if (e.echecs >= MAX_ECHECS) e.bloqueJusqua = maintenant + DUREE_MS;
}

const reussite = (ip, email) => etats.delete(cle(ip, email));
const reinitialiser = () => etats.clear();

module.exports = { attente, echec, reussite, reinitialiser, MAX_ECHECS, DUREE_MS };

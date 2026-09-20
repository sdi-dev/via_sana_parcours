import { useEffect, useState } from 'react';
import { appeler } from '@api';
import { useAuth } from '@auth/AuthContext';

// Coordonnées de tous les praticiens, pour se contacter directement
export default function AnnuairePraticiens() {
  const { utilisateur } = useAuth();
  const [praticiens, setPraticiens] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appeler('/praticiens').then(setPraticiens).catch((e) => setErreur(e.message));
  }, []);

  return (
    <section aria-labelledby="titre-annuaire">
      <h2 id="titre-annuaire" className="titre-section mb-2">L&apos;<em>équipe</em></h2>
      <p className="chapo mb-6 font-texte">Contactez directement les praticiens qui suivent vos patients.</p>

      {erreur && <div role="alert" className="alert alert-error">{erreur}</div>}
      {!praticiens && !erreur && <p role="status" className="min-h-48">Chargement…</p>}

      {praticiens && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {praticiens.map((p) => (
            <li key={p.id} className="carte">
              <span className="pastille pastille-sombre">{p.specialite}</span>
              <p className="mt-3 text-lg font-medium">{p.prenom} {p.nom}{p.id === utilisateur.id && ' (vous)'}</p>
              <a className="link break-all text-sm" href={`mailto:${p.email}`}>{p.email}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

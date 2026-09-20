import { Link, Outlet } from 'react-router';
import { useAuth } from '@auth/AuthContext';
import SelecteurTheme from '@components/SelecteurTheme';

export function EnTete() {
  const { utilisateur, deconnexion } = useAuth();
  return (
    <header className="bande-creme border-b border-base-300">
      <div className="conteneur flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
        <Link to="/" className="logo" aria-label="PrépaMarathon, accueil">Prépa<span aria-hidden="true">Marathon</span></Link>
        <span className="hidden text-xs opacity-70 sm:inline">Suivi de parcours · Via Sana</span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <SelecteurTheme />
          {utilisateur && (
            <>
              <span>{utilisateur.prenom} {utilisateur.nom}</span>
              <span className="pastille">{utilisateur.role === 'praticien' ? 'Praticien' : 'Patient'}</span>
              <button type="button" className="btn btn-sm btn-neutral" onClick={deconnexion}>Se déconnecter</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PiedDePage() {
  return (
    <footer className="bg-base-content py-10 text-base-100">
      <div className="conteneur flex flex-wrap items-center justify-between gap-4">
        <p className="logo logo-pied text-base-100">Prépa<span>Marathon</span></p>
        <p>Via Sana - Prepamarathon exo - Yanis Saoudi 21/09/2026</p>
      </div>
      <div className="conteneur mt-4 text-xs opacity-70">
        <p>Prototype de démonstration : données fictives. En production, hébergement de données de santé certifié HDS requis.</p>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { chargement } = useAuth();

  // Tant que la session n'est pas restaurée, on n'affiche ni en-tête ni pied de page :
  // l'ensemble apparaît d'un coup, sans décalage de mise en page
  if (chargement) {
    return <p role="status" className="min-h-screen bg-base-200 p-8">Chargement…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-2 focus:btn focus:btn-primary">
        Aller au contenu
      </a>
      <EnTete />
      <main id="contenu" className="min-h-screen flex-1">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  );
}

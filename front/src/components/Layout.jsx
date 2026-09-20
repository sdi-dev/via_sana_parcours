import { Link, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import SelecteurTheme from './SelecteurTheme';

export default function Layout() {
    const { utilisateur, deconnexion } = useAuth();

    return (
        <div className="min-h-screen bg-base-200">
            <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-2 focus:btn focus:btn-primary">
                Aller au contenu
            </a>
            <header className="navbar bg-base-100 shadow-sm px-4 flex-wrap gap-2">
                <div className="flex-1">
                    <Link to="/" className="font-titre text-xl tracking-wide">Via Sana · Suivi de parcours</Link>
                </div>
                <SelecteurTheme />
                {utilisateur && (
                    <div className="flex items-center gap-3">
                        <span>{utilisateur.prenom} {utilisateur.nom}</span>
                        <span className="badge badge-outline">{utilisateur.role === 'praticien' ? 'Praticien' : 'Patient'}</span>
                        <button type="button" className="btn btn-sm btn-primary" onClick={deconnexion}>Se déconnecter</button>
                    </div>
                )}
            </header>
            <main id="contenu" className="mx-auto max-w-6xl p-4">
                <Outlet />
            </main>
        </div>
    );
}
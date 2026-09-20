import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import SelecteurTheme from '../components/SelecteurTheme';

const MOT_DE_PASSE_DEMO = 'Demo1234!';
const COMPTES_DEMO = [
  { libelle: 'Démo praticien', email: 'sam.lefevre@example.com' },
  { libelle: 'Démo patient', email: 'lea.martin@example.com' },
];

export default function Connexion() {
  const { utilisateur, connexion } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  if (utilisateur) return <Navigate to="/" replace />;

  async function envoyer(emailSaisi, motDePasseSaisi) {
    setErreur('');
    setEnCours(true);
    try {
      await connexion(emailSaisi, motDePasseSaisi);
    } catch (e) {
      setErreur(e.message);
      setEnCours(false);
    }
  }

  return (
      <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4"><SelecteurTheme /></div>
        <div className="card bg-base-100 shadow-md w-full max-w-md">
          <div className="card-body">
            <h1 className="card-title text-2xl">Connexion</h1>
            <p className="font-texte text-sm opacity-80">Suivi de parcours Via Sana · prototype de démonstration</p>

            <form
                className="flex flex-col gap-3 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  envoyer(email, motDePasse);
                }}
            >
              <label className="form-control w-full">
                <span className="label-text mb-1 block">Adresse e-mail</span>
                <input type="email" className="input input-bordered w-full" value={email} required
                       autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 block">Mot de passe</span>
                <input type="password" className="input input-bordered w-full" value={motDePasse} required
                       autoComplete="current-password" onChange={(e) => setMotDePasse(e.target.value)} />
              </label>

              {erreur && <div role="alert" className="alert alert-error">{erreur}</div>}

              <button type="submit" className="btn btn-primary" disabled={enCours}>
                {enCours ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="divider text-sm">Comptes de démonstration</div>
            <div className="flex gap-2">
              {COMPTES_DEMO.map((compte) => (
                  <button key={compte.email} type="button" className="btn btn-outline flex-1" disabled={enCours}
                          onClick={() => envoyer(compte.email, MOT_DE_PASSE_DEMO)}>
                    {compte.libelle}
                  </button>
              ))}
            </div>
          </div>
        </div>
      </main>
  );
}
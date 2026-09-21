import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@auth/useAuth';
import Bande from '@components/Bande';
import Carte from '@components/Carte';
import { EnTete, PiedDePage } from '@components/Layout';
import Pastille from '@components/Pastille';

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
    <div className="flex min-h-screen flex-col bg-base-200">
      <EnTete />
      <main className="flex-1">
        <Bande ton="creme" className="relative overflow-hidden">
          <span aria-hidden="true" className="contour-decoratif absolute -right-6 top-4 hidden text-[10rem] md:block">Parcours</span>
          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="cascade">
              <Pastille icone={MapPin}>Suivi de parcours · Paris</Pastille>
              <h1 className="titre-hero mt-4">Accédez à votre <em>suivi</em></h1>
              <p className="chapo mt-5 font-texte">
                Un dossier unique, une équipe coordonnée. Retrouvez vos étapes, vos séances et les messages de vos praticiens.
              </p>
              <p className="mt-4 text-sm opacity-70">Prototype de démonstration · données fictives</p>
            </div>

            <Carte titre="Connexion">
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  envoyer(email, motDePasse);
                }}
              >
                <label className="flex flex-col gap-1">
                  <span>Adresse e-mail</span>
                  <input type="email" className="input w-full" value={email} required
                    autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Mot de passe</span>
                  <input type="password" className="input w-full" value={motDePasse} required
                    autoComplete="current-password" onChange={(e) => setMotDePasse(e.target.value)} />
                </label>

                {erreur && <div role="alert" className="alert alert-error">{erreur}</div>}

                <button type="submit" className="btn btn-primary" disabled={enCours}>
                  {enCours ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>

              <div className="divider text-sm">Comptes de démonstration</div>
              <div className="flex flex-wrap gap-2">
                {COMPTES_DEMO.map((compte) => (
                  <button key={compte.email} type="button" className="btn btn-neutral flex-1" disabled={enCours}
                    onClick={() => envoyer(compte.email, MOT_DE_PASSE_DEMO)}>
                    {compte.libelle}
                  </button>
                ))}
              </div>
            </Carte>
          </div>
        </Bande>
      </main>
      <PiedDePage />
    </div>
  );
}

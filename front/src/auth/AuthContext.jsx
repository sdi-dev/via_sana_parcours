import { createContext, useContext, useEffect, useState } from 'react';
import { appeler, jeton } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(Boolean(jeton.lire()));

  // Restaure la session après un rechargement de la page
  useEffect(() => {
    if (!jeton.lire()) return;
    appeler('/session')
      .then(setUtilisateur)
      .catch(() => jeton.effacer())
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    const expirer = () => {
      jeton.effacer();
      setUtilisateur(null);
    };
    window.addEventListener('session-expiree', expirer);
    return () => window.removeEventListener('session-expiree', expirer);
  }, []);

  async function connexion(email, motDePasse) {
    const donnees = await appeler('/login', { methode: 'POST', corps: { email, motDePasse } });
    jeton.ecrire(donnees.token);
    setUtilisateur(donnees.utilisateur);
  }

  function deconnexion() {
    jeton.effacer();
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

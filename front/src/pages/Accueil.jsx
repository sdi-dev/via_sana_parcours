import { Navigate } from 'react-router';
import { useAuth } from '@auth/AuthContext';

// Aiguille l'utilisateur vers son espace selon son rôle
export default function Accueil() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return <p role="status" className="p-8">Chargement…</p>;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  return <Navigate to={utilisateur.role === 'praticien' ? '/praticien' : '/patient'} replace />;
}

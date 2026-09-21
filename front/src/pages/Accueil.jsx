import { Navigate } from 'react-router';
import { useAuth } from '@auth/useAuth';
import Chargement from '@components/Chargement';

// Aiguille l'utilisateur vers son espace selon son rôle
export default function Accueil() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return <Chargement className="min-h-96" />;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  return <Navigate to={utilisateur.role === 'praticien' ? '/praticien' : '/patient'} replace />;
}

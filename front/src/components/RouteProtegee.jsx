import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@auth/useAuth';
import Chargement from '@components/Chargement';

// Laisse passer uniquement un utilisateur connecté (et du bon rôle, si précisé)
export default function RouteProtegee({ role }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return <Chargement className="min-h-96" />;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (role && utilisateur.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

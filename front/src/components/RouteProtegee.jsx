import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@auth/AuthContext';

// Laisse passer uniquement un utilisateur connecté (et du bon rôle, si précisé)
export default function RouteProtegee({ role }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return <p role="status" className="p-8">Chargement…</p>;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (role && utilisateur.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

export default function MeRedirect() {
  const { user, isHydrating } = useAuth();
  const location = useLocation();

  if (isHydrating) return null;
  if (!user) {
    const next = encodeURIComponent('/me' + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }
  return <Navigate to={`/profile/${user.username}${location.search}`} replace />;
}

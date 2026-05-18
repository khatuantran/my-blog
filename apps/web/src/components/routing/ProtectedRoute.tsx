import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

type Props = {
  children: React.ReactNode;
  requireRole?: 'ADMIN' | 'USER';
};

export function ProtectedRoute({ children, requireRole }: Props) {
  const { isAuthed, user } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

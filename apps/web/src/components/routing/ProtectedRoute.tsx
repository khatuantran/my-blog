import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types/api';

type Props = {
  children: React.ReactNode;
  requireRole?: Role;
};

// Hydration-aware route guard. Render null khi store đang hydrate để tránh
// flash redirect (AppLayout splash overlay đã cover màn hình).
export function ProtectedRoute({ children, requireRole }: Props) {
  const { isAuthed, isHydrating, user } = useAuth();
  const location = useLocation();

  if (isHydrating) return null;

  if (!isAuthed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

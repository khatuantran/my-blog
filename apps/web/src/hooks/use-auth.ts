import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/services/api/auth';

export type { AuthUser };

export type AuthState = {
  isAuthed: boolean;
  isHydrating: boolean;
  user: AuthUser | null;
};

export function useAuth(): AuthState {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  return {
    isAuthed: status === 'authed' && !!user,
    isHydrating: status === 'idle' || status === 'hydrating',
    user,
  };
}

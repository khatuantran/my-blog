import { create } from 'zustand';
import { getMe, type AuthUser } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';

export type AuthStatus = 'idle' | 'hydrating' | 'authed' | 'guest';

type State = {
  user: AuthUser | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setUser: (u: AuthUser) => void;
  clear: () => void;
};

export const useAuthStore = create<State>((set, get) => ({
  user: null,
  status: 'idle',

  async hydrate() {
    if (get().status === 'hydrating') return; // dedupe
    set({ status: 'hydrating' });
    try {
      const user = await getMe();
      set({ user, status: 'authed' });
    } catch (err) {
      // 401 hoặc network → guest
      if (err instanceof ApiError && err.status !== 401) {
        // Non-auth error: vẫn fallback guest để app boot được
        // (console will surface error elsewhere)
      }
      set({ user: null, status: 'guest' });
    }
  },

  setUser(u) {
    set({ user: u, status: 'authed' });
  },

  clear() {
    set({ user: null, status: 'guest' });
  },
}));

// Listen logout event từ client.ts (refresh fail → clear store).
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    const { status, clear } = useAuthStore.getState();
    if (status === 'authed') clear();
  });
}

// Auth hook stub — wire thật ở M10 (auth flow + Zustand store)
// Hiện tại hardcode admin session để layout shell + ProtectedRoute hoạt động.

export type AuthUser = {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
};

export type AuthState = {
  isAuthed: boolean;
  user: AuthUser | null;
};

export function useAuth(): AuthState {
  // TODO(M10): replace với Zustand store hydrated từ GET /auth/me cookie session.
  return {
    isAuthed: true,
    user: { id: 'stub-admin', username: 'admin', role: 'ADMIN' },
  };
}

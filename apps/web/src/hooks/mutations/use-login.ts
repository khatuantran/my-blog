import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, type AuthUser, type LoginDto } from '@/services/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function useLogin() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation<AuthUser, Error, LoginDto>({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      // Sau khi login → invalidate post lists (BE có thể trả liked/saved per-user khác).
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

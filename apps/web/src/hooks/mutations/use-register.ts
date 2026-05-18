import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register, type AuthUser, type RegisterDto } from '@/services/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function useRegister() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation<AuthUser, Error, RegisterDto>({
    mutationFn: register,
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

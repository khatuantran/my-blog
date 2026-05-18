import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/services/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSettled: () => {
      // Clear bất kể server response (cookie đã invalid local).
      clear();
      qc.clear();
    },
  });
}

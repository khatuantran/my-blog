import { useMutation, useQueryClient } from '@tanstack/react-query';
import { banUser, unbanUser } from '@/services/api/users';
import { qk } from '@/lib/query-keys';

type Vars = { userId: string; banned: boolean };

export function useToggleBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, banned }: Vars) => (banned ? unbanUser(userId) : banUser(userId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}

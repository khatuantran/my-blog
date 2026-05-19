import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePassword, updateUser } from '@/services/api/users';
import type { ProfileUser, UpdateUserPayload } from '@/types/api';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<ProfileUser, Error, { id: string; body: UpdateUserPayload }>({
    mutationFn: ({ id, body }) => updateUser(id, body),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['users', 'by-username', user.username] });
      qc.invalidateQueries({ queryKey: ['users', 'stats', user.id] });
    },
  });
}

export function useChangePassword() {
  return useMutation<{ ok: true }, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: (body) => changePassword(body),
  });
}

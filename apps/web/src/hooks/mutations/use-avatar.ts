import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/client';
import { removeAvatar, uploadAvatarChain, type AvatarResponse } from '@/services/api/avatar';
import { useAuthStore } from '@/stores/auth-store';

// FR-11.7 — Avatar upload/remove. Sau khi đổi avatar:
// 1. Patch Zustand auth store (nguồn của useAuth → TopBar AvatarMenu). BẮT BUỘC vì auth state
//    đến từ store (hydrate/getMe), KHÔNG phải TanStack query → invalidate query không refresh nó.
// 2. Invalidate user-by-username query (ProfilePage hero / PostHeader / NotifRow refetch).
function syncAvatar(res: AvatarResponse, qc: ReturnType<typeof useQueryClient>, username?: string) {
  const { user, setUser } = useAuthStore.getState();
  if (user) setUser({ ...user, avatarUrl: res.avatarUrl, avatarPublicId: res.avatarPublicId });
  if (username) qc.invalidateQueries({ queryKey: ['user-by-username', username] });
}

export function useUploadAvatar(username?: string) {
  const qc = useQueryClient();
  return useMutation<AvatarResponse, ApiError | Error, Blob>({
    mutationFn: (blob) => uploadAvatarChain(blob),
    onSuccess: (res) => syncAvatar(res, qc, username),
  });
}

export function useRemoveAvatar(username?: string) {
  const qc = useQueryClient();
  return useMutation<AvatarResponse, ApiError | Error, void>({
    mutationFn: () => removeAvatar(),
    onSuccess: (res) => syncAvatar(res, qc, username),
  });
}

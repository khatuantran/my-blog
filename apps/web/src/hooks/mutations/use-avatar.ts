import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/client';
import { removeAvatar, uploadAvatarChain, type AvatarResponse } from '@/services/api/avatar';

// FR-11.7 — Avatar upload/remove. Invalidate user-by-username + auth me queries
// để mọi UI surface (ProfilePage hero / TopBar AvatarMenu / PostHeader / NotifRow)
// đều refetch với avatarUrl mới.
function invalidateAvatarQueries(qc: ReturnType<typeof useQueryClient>, username?: string) {
  qc.invalidateQueries({ queryKey: ['auth-me'] });
  if (username) qc.invalidateQueries({ queryKey: ['user-by-username', username] });
}

export function useUploadAvatar(username?: string) {
  const qc = useQueryClient();
  return useMutation<AvatarResponse, ApiError | Error, Blob>({
    mutationFn: (blob) => uploadAvatarChain(blob),
    onSuccess: () => invalidateAvatarQueries(qc, username),
  });
}

export function useRemoveAvatar(username?: string) {
  const qc = useQueryClient();
  return useMutation<AvatarResponse, ApiError | Error, void>({
    mutationFn: () => removeAvatar(),
    onSuccess: () => invalidateAvatarQueries(qc, username),
  });
}

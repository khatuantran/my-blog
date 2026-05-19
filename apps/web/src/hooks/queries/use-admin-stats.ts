import { useQuery } from '@tanstack/react-query';
import { getStats, getMoods, listAdminComments } from '@/services/api/admin';
import { qk } from '@/lib/query-keys';
import type { CommentStatus } from '@/types/api';

export function useAdminStats() {
  return useQuery({ queryKey: qk.admin.stats, queryFn: getStats });
}

export function useAdminMoods() {
  return useQuery({ queryKey: qk.admin.moods, queryFn: getMoods });
}

export function useAdminComments(status: CommentStatus = 'PENDING') {
  return useQuery({
    queryKey: qk.admin.comments({ status }),
    queryFn: () => listAdminComments({ status }),
  });
}

import { useQuery } from '@tanstack/react-query';
import { getStats, getMoods } from '@/services/api/admin';
import { qk } from '@/lib/query-keys';

export function useAdminStats() {
  return useQuery({ queryKey: qk.admin.stats, queryFn: getStats });
}

export function useAdminMoods() {
  return useQuery({ queryKey: qk.admin.moods, queryFn: getMoods });
}

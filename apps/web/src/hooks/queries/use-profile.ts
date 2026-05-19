import { useQuery } from '@tanstack/react-query';
import { getUserByUsername, getUserStats } from '@/services/api/users';
import { qk } from '@/lib/query-keys';

export function useUserByUsername(username: string | undefined) {
  return useQuery({
    queryKey: username ? qk.users.byUsername(username) : ['users', 'by-username', 'noop'],
    queryFn: () => getUserByUsername(username as string),
    enabled: !!username,
  });
}

export function useUserStats(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.users.stats(id) : ['users', 'stats', 'noop'],
    queryFn: () => getUserStats(id as string),
    enabled: !!id,
  });
}

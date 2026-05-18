import { useQuery } from '@tanstack/react-query';
import { listUsers, type ListUsersParams } from '@/services/api/users';
import { qk } from '@/lib/query-keys';

export function useUsersList(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: qk.users.list(params),
    queryFn: () => listUsers(params),
  });
}

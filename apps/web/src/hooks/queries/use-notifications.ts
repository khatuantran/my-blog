import { useQuery } from '@tanstack/react-query';
import { listNotifications } from '@/services/api/notifications';
import { qk } from '@/lib/query-keys';
import type { ListNotificationsParams } from '@/types/api';

export function useNotifications(params: ListNotificationsParams = {}) {
  return useQuery({
    queryKey: qk.notifications.list(params),
    queryFn: () => listNotifications(params),
  });
}

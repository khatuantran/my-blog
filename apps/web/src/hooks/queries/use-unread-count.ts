import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/services/api/notifications';
import { qk } from '@/lib/query-keys';
import { useAuth } from '@/hooks/use-auth';

// FR-14.6: v1 polling 30s (WS defer T-315)
const POLL_INTERVAL_MS = 30_000;

export function useUnreadCount() {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
    enabled: isAuthed,
  });
}

import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/services/api/notifications';
import { qk } from '@/lib/query-keys';
import { useAuth } from '@/hooks/use-auth';

// FR-14.6 (amended T-477): KHÔNG interval polling — fetch khi mount/reload trang
// + invalidate sau action của user (mark read / mark-all / delete). Realtime push defer T-315.
export function useUnreadCount() {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: getUnreadCount,
    enabled: isAuthed,
  });
}

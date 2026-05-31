import { useQuery } from '@tanstack/react-query';
import { listInteractionLogs } from '@/services/api/admin-logs';
import { qk } from '@/lib/query-keys';
import type { ListInteractionLogsParams } from '@/types/api';

export function useInteractionLogs(params: ListInteractionLogsParams = {}) {
  return useQuery({
    queryKey: qk.admin.logs(params),
    queryFn: () => listInteractionLogs(params),
  });
}

import { useQuery } from '@tanstack/react-query';
import { listTags } from '@/services/api/tags';
import { qk } from '@/lib/query-keys';
import type { ListTagsParams } from '@/types/api';

export function useTags(params: ListTagsParams = {}) {
  return useQuery({
    queryKey: qk.tags.list(params),
    queryFn: () => listTags(params),
  });
}

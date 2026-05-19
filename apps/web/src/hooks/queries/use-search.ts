import { useQuery } from '@tanstack/react-query';
import { searchAll } from '@/services/api/search';
import { qk } from '@/lib/query-keys';
import type { SearchParams } from '@/types/api';

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: qk.search({
      q: params.q,
      type: params.type,
      mood: params.mood,
    }),
    queryFn: () => searchAll(params),
  });
}

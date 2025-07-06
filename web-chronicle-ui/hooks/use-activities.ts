import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { useActivityStore } from '@/providers/activity-store-provider'

export function useActivities(pageSize: number = DEFAULT_PAGE_SIZE) {
  const filter = useActivityStore((state) => state.filter)

  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.activities, filter],
    queryFn: ({ pageParam }) =>
      api.getActivities({
        page: pageParam,
        limit: pageSize,
        filter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.page > 1 ? firstPage.page - 1 : undefined,
  })
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.activity(id),
    queryFn: () => api.getActivity(id),
    enabled: !!id,
  })
}

export function useSummary(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.summary(id),
    queryFn: () => api.getSummary(id),
    enabled: !!id,
    staleTime: Infinity, // Summaries don't change
  })
}

export function useDomainStats() {
  return useQuery({
    queryKey: QUERY_KEYS.domains,
    queryFn: () => api.getDomainStats(),
  })
}

export function useTagStats() {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: () => api.getTagStats(),
  })
}

export function useAnalytics(days: number = 30) {
  return useQuery({
    queryKey: [...QUERY_KEYS.analytics, days],
    queryFn: () => api.getAnalytics(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSearch(query: string, limit: number = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.search, query, limit],
    queryFn: () => api.search(query, limit),
    enabled: !!query && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
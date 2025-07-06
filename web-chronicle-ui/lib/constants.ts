export const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://activity-log-worker.rickoslyder.workers.dev'
export const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || ''

export const QUERY_KEYS = {
  activities: ['activities'] as const,
  activity: (id: string) => ['activity', id] as const,
  summary: (id: string) => ['summary', id] as const,
  search: (query: string) => ['search', query] as const,
  analytics: ['analytics'] as const,
  domains: ['domains'] as const,
  tags: ['tags'] as const,
} as const

export const DEFAULT_PAGE_SIZE = 20
export const REFETCH_INTERVAL = 30000 // 30 seconds
export const STALE_TIME = 60000 // 1 minute
export interface ActivityLog {
  id: string
  url: string
  title: string
  domain: string
  visitedAt: string
  contentLength: number
  scrollDepth: number
  timeOnPage: number
  timeSpent: number
  wordCount?: number
  createdAt: string
  tagsJson?: string
  tags?: string[]
  summary?: string
  contentHash?: string
  content?: string
  favicon?: string
}

export interface ActivityLogWithTags extends ActivityLog {
  tags: string[]
}

export interface SearchResult {
  activity: ActivityLog
  score: number
}

export interface Filter {
  dateRange?: {
    from: Date
    to: Date
  }
  domains?: string[]
  tags?: string[]
  searchQuery?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  error: string
  message: string
  status: number
}

export interface Settings {
  workerUrl: string
  authToken: string
  autoRefresh: boolean
  showSummaries: boolean
  showScreenshots: boolean
  defaultView: 'timeline' | 'analytics' | 'search' | 'insights'
  theme: 'light' | 'dark' | 'system'
}

export interface AnalyticsData {
  totalActivities: number
  dailyTrends: Array<{ date: string; count: number }>
  hourlyDistribution: Array<{ hour: number; count: number }>
  averageTimeOnPage: number
}

export interface DomainStats {
  domain: string
  count: number
  totalTime: number
  lastVisit: string
}

export interface TagStats {
  tag: string
  count: number
}
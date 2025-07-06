import { 
  ActivityLog, 
  PaginatedResponse, 
  SearchResult, 
  Filter,
  AnalyticsData,
  DomainStats,
  TagStats,
  ApiError
} from '@/types'
import { WORKER_URL, AUTH_TOKEN } from './constants'

class ApiClient {
  private baseUrl: string
  private authToken: string

  constructor(baseUrl: string = WORKER_URL, authToken: string = AUTH_TOKEN) {
    this.baseUrl = baseUrl
    this.authToken = authToken
  }

  private async fetcher<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error: ApiError = {
        error: 'API Error',
        message: response.statusText,
        status: response.status,
      }
      
      try {
        const data = await response.json()
        Object.assign(error, data)
      } catch {}
      
      throw error
    }

    return response.json()
  }

  // Activity logs
  async getActivities(params?: {
    page?: number
    limit?: number
    filter?: Filter
  }): Promise<PaginatedResponse<ActivityLog>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.filter?.dateRange) {
      searchParams.set('startDate', params.filter.dateRange.from.toISOString())
      searchParams.set('endDate', params.filter.dateRange.to.toISOString())
    }
    if (params?.filter?.domains?.length) {
      searchParams.set('domains', params.filter.domains.join(','))
    }
    if (params?.filter?.tags?.length) {
      searchParams.set('tags', params.filter.tags.join(','))
    }

    const endpoint = `/api/logs?${searchParams.toString()}`
    const response = await this.fetcher<{
      logs: ActivityLog[]
      total: number
      page: number
      limit: number
    }>(endpoint)

    return {
      data: response.logs,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.logs.length === response.limit,
    }
  }

  async getActivity(id: string): Promise<ActivityLog> {
    return this.fetcher<ActivityLog>(`/api/logs/${id}`)
  }

  async getSummary(id: string): Promise<{ summary: string }> {
    return this.fetcher<{ summary: string }>(`/logs/${id}/summary`)
  }

  async getContent(id: string): Promise<{ content: string }> {
    return this.fetcher<{ content: string }>(`/log-content/${id}`)
  }

  // Search
  async search(query: string, limit: number = 20): Promise<SearchResult[]> {
    const response = await this.fetcher<{
      results: SearchResult[]
    }>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    })
    
    return response.results
  }

  // Analytics
  async getAnalytics(days: number = 30): Promise<AnalyticsData> {
    // For now, compute analytics client-side
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    
    const response = await this.getActivities({ limit: 1000 })
    const activities = response.data
    
    // Calculate daily trends
    const dailyMap = new Map<string, number>()
    activities.forEach(log => {
      const date = new Date(log.visitedAt).toLocaleDateString()
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
    })
    
    // Calculate hourly distribution
    const hourlyMap = new Map<number, number>()
    activities.forEach(log => {
      const hour = new Date(log.visitedAt).getHours()
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
    })
    
    // Format for charts
    const dailyTrends = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
    
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyMap.get(hour) || 0
    }))
    
    return {
      totalActivities: activities.length,
      dailyTrends,
      hourlyDistribution,
      averageTimeOnPage: activities.reduce((sum, log) => sum + log.timeOnPage, 0) / activities.length || 0,
    }
  }

  async getDomainStats(): Promise<DomainStats[]> {
    const response = await this.getActivities({ limit: 1000 })
    
    // Process client-side for now
    const domainMap = new Map<string, DomainStats>()
    
    response.data.forEach(log => {
      const existing = domainMap.get(log.domain) || {
        domain: log.domain,
        count: 0,
        totalTime: 0,
        lastVisit: log.visitedAt,
      }
      
      domainMap.set(log.domain, {
        ...existing,
        count: existing.count + 1,
        totalTime: existing.totalTime + log.timeOnPage,
        lastVisit: new Date(log.visitedAt) > new Date(existing.lastVisit) 
          ? log.visitedAt 
          : existing.lastVisit,
      })
    })
    
    return Array.from(domainMap.values()).sort((a, b) => b.count - a.count)
  }

  async getTagStats(): Promise<TagStats[]> {
    const response = await this.getActivities({ limit: 1000 })
    
    // Process client-side for now
    const tagMap = new Map<string, number>()
    
    response.data.forEach(log => {
      if (log.tagsJson) {
        try {
          const tags = JSON.parse(log.tagsJson) as string[]
          tags.forEach(tag => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
          })
        } catch {}
      }
    })
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Browser rendering
  async getScreenshot(url: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/browser/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Failed to get screenshot')
    }

    return response.blob()
  }

  async extractContent(url: string): Promise<{ content: string }> {
    return this.fetcher<{ content: string }>('/browser/extract', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  async generatePdf(url: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/browser/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }

    return response.blob()
  }
}

// Export singleton instance
export const api = new ApiClient()

// Export class for custom instances
export { ApiClient }
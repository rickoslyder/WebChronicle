import { ActivityLog } from '@/types'

export interface QueryToken {
  type: 'text' | 'operator' | 'field' | 'date' | 'quoted'
  value: string
  field?: string
}

export interface ParsedQuery {
  tokens: QueryToken[]
  filters: {
    text?: string[]
    domain?: string[]
    tag?: string[]
    title?: string[]
    dateRange?: {
      from?: Date
      to?: Date
    }
    timeSpent?: {
      min?: number
      max?: number
    }
  }
  operators: {
    and: boolean
    or: boolean
    not: string[]
  }
}

// Query syntax examples:
// - Simple text: "javascript tutorial"
// - Field search: domain:github.com title:"React hooks"
// - Date range: after:2024-01-01 before:2024-12-31
// - Time spent: time:>300 (more than 5 minutes)
// - Tags: tag:programming tag:tutorial
// - Operators: javascript AND tutorial NOT redux
// - Complex: domain:github.com AND (tag:javascript OR tag:typescript) after:2024-01-01

const FIELD_ALIASES: Record<string, string> = {
  site: 'domain',
  website: 'domain',
  url: 'domain',
  heading: 'title',
  h1: 'title',
  label: 'tag',
  category: 'tag',
  duration: 'time',
  timespent: 'time',
  spent: 'time',
}

export function parseQuery(query: string): ParsedQuery {
  const tokens: QueryToken[] = []
  const filters: ParsedQuery['filters'] = {}
  const operators: ParsedQuery['operators'] = {
    and: false,
    or: false,
    not: [],
  }

  // Tokenize the query
  const regex = /(?:(\w+):)?(?:"([^"]+)"|'([^']+)'|([^\s]+))/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(query)) !== null) {
    const field = match[1]?.toLowerCase()
    const quotedValue = match[2] || match[3]
    const value = quotedValue || match[4]

    // Handle operators
    if (!field && ['AND', 'OR', 'NOT'].includes(value.toUpperCase())) {
      tokens.push({ type: 'operator', value: value.toUpperCase() })
      if (value.toUpperCase() === 'AND') operators.and = true
      if (value.toUpperCase() === 'OR') operators.or = true
      continue
    }

    // Handle NOT operator with next token
    if (tokens.length > 0 && tokens[tokens.length - 1].value === 'NOT') {
      operators.not.push(value)
    }

    // Handle field searches
    if (field) {
      const normalizedField = FIELD_ALIASES[field] || field
      tokens.push({ type: 'field', value, field: normalizedField })

      // Process specific field types
      switch (normalizedField) {
        case 'domain':
          if (!filters.domain) filters.domain = []
          filters.domain.push(value)
          break

        case 'tag':
          if (!filters.tag) filters.tag = []
          filters.tag.push(value)
          break

        case 'title':
          if (!filters.title) filters.title = []
          filters.title.push(value)
          break

        case 'after':
        case 'since':
          filters.dateRange = filters.dateRange || {}
          filters.dateRange.from = parseDate(value)
          break

        case 'before':
        case 'until':
          filters.dateRange = filters.dateRange || {}
          filters.dateRange.to = parseDate(value)
          break

        case 'time':
          filters.timeSpent = parseTimeFilter(value)
          break
      }
    } else {
      // Regular text search
      tokens.push({ type: quotedValue ? 'quoted' : 'text', value })
      if (!filters.text) filters.text = []
      filters.text.push(value)
    }
  }

  return { tokens, filters, operators }
}

function parseDate(dateStr: string): Date | undefined {
  // Handle relative dates
  const now = new Date()
  const lowerStr = dateStr.toLowerCase()

  if (lowerStr === 'today') {
    return new Date(now.setHours(0, 0, 0, 0))
  } else if (lowerStr === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return new Date(yesterday.setHours(0, 0, 0, 0))
  } else if (lowerStr === 'week' || lowerStr === '7d') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return weekAgo
  } else if (lowerStr === 'month' || lowerStr === '30d') {
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return monthAgo
  } else if (lowerStr.match(/^\d+d$/)) {
    const days = parseInt(lowerStr)
    const daysAgo = new Date(now)
    daysAgo.setDate(daysAgo.getDate() - days)
    return daysAgo
  }

  // Try to parse as date
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

function parseTimeFilter(value: string): ParsedQuery['filters']['timeSpent'] {
  const result: ParsedQuery['filters']['timeSpent'] = {}

  // Handle comparison operators
  if (value.startsWith('>')) {
    result.min = parseInt(value.slice(1))
  } else if (value.startsWith('<')) {
    result.max = parseInt(value.slice(1))
  } else if (value.includes('-')) {
    const [min, max] = value.split('-').map(v => parseInt(v))
    result.min = min
    result.max = max
  } else {
    const exact = parseInt(value)
    result.min = exact
    result.max = exact
  }

  return result
}

export function applyQueryToActivities(
  activities: ActivityLog[],
  query: ParsedQuery
): ActivityLog[] {
  return activities.filter(activity => {
    // Check text filters
    if (query.filters.text && query.filters.text.length > 0) {
      const searchableText = `${activity.title} ${activity.domain} ${activity.summary || ''} ${activity.tags?.join(' ') || ''}`.toLowerCase()
      
      const textMatches = query.filters.text.some(text => {
        const lowerText = text.toLowerCase()
        // Check if it's in the NOT list
        if (query.operators.not.includes(text)) {
          return !searchableText.includes(lowerText)
        }
        return searchableText.includes(lowerText)
      })

      if (!textMatches) return false
    }

    // Check domain filters
    if (query.filters.domain && query.filters.domain.length > 0) {
      const domainMatches = query.filters.domain.some(domain =>
        activity.domain.toLowerCase().includes(domain.toLowerCase())
      )
      if (!domainMatches) return false
    }

    // Check tag filters
    if (query.filters.tag && query.filters.tag.length > 0) {
      const activityTags = activity.tags?.map(t => t.toLowerCase()) || []
      const tagMatches = query.filters.tag.some(tag =>
        activityTags.includes(tag.toLowerCase())
      )
      if (!tagMatches) return false
    }

    // Check title filters
    if (query.filters.title && query.filters.title.length > 0) {
      const titleMatches = query.filters.title.some(title =>
        activity.title.toLowerCase().includes(title.toLowerCase())
      )
      if (!titleMatches) return false
    }

    // Check date range
    if (query.filters.dateRange) {
      const activityDate = new Date(activity.visitedAt)
      if (query.filters.dateRange.from && activityDate < query.filters.dateRange.from) {
        return false
      }
      if (query.filters.dateRange.to && activityDate > query.filters.dateRange.to) {
        return false
      }
    }

    // Check time spent
    if (query.filters.timeSpent) {
      if (query.filters.timeSpent.min && activity.timeSpent < query.filters.timeSpent.min) {
        return false
      }
      if (query.filters.timeSpent.max && activity.timeSpent > query.filters.timeSpent.max) {
        return false
      }
    }

    return true
  })
}

export function highlightQueryInText(text: string, query: ParsedQuery): string {
  let highlightedText = text

  // Highlight text matches
  if (query.filters.text) {
    query.filters.text.forEach(term => {
      if (!query.operators.not.includes(term)) {
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
      }
    })
  }

  return highlightedText
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
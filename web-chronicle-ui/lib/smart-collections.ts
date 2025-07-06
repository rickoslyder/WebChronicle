import { ActivityLogWithTags } from '@/types'

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rules: CollectionRule[]
  activities?: ActivityLogWithTags[]
  count?: number
}

export interface CollectionRule {
  field: 'domain' | 'tag' | 'title' | 'time' | 'frequency'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number | string[] | number[]
}

// Predefined smart collections
export const DEFAULT_COLLECTIONS: Omit<SmartCollection, 'activities' | 'count'>[] = [
  {
    id: 'work-research',
    name: 'Work & Research',
    description: 'Professional development and research activities',
    icon: '💼',
    color: 'blue',
    rules: [
      { field: 'domain', operator: 'contains', value: ['github.com', 'gitlab.com', 'stackoverflow.com', 'docs.', 'developer.'] },
      { field: 'tag', operator: 'contains', value: ['programming', 'development', 'documentation', 'api', 'tutorial'] },
    ],
  },
  {
    id: 'learning',
    name: 'Learning & Education',
    description: 'Educational content and online courses',
    icon: '📚',
    color: 'green',
    rules: [
      { field: 'domain', operator: 'contains', value: ['coursera.', 'udemy.', 'edx.', 'khanacademy.', 'youtube.com/watch'] },
      { field: 'tag', operator: 'contains', value: ['tutorial', 'course', 'learn', 'education', 'guide'] },
      { field: 'time', operator: 'greaterThan', value: 300 }, // More than 5 minutes
    ],
  },
  {
    id: 'quick-reads',
    name: 'Quick Reads',
    description: 'Short articles and quick references',
    icon: '⚡',
    color: 'yellow',
    rules: [
      { field: 'time', operator: 'between', value: [30, 300] }, // 30 seconds to 5 minutes
      { field: 'tag', operator: 'contains', value: ['article', 'blog', 'news'] },
    ],
  },
  {
    id: 'deep-dives',
    name: 'Deep Dives',
    description: 'Long-form content and focused sessions',
    icon: '🏊',
    color: 'purple',
    rules: [
      { field: 'time', operator: 'greaterThan', value: 900 }, // More than 15 minutes
    ],
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Social networking and communication',
    icon: '💬',
    color: 'pink',
    rules: [
      { field: 'domain', operator: 'contains', value: ['twitter.com', 'x.com', 'facebook.com', 'linkedin.com', 'reddit.com', 'instagram.com'] },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Videos, games, and leisure content',
    icon: '🎮',
    color: 'orange',
    rules: [
      { field: 'domain', operator: 'contains', value: ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com'] },
      { field: 'tag', operator: 'contains', value: ['video', 'game', 'entertainment', 'music'] },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping & Commerce',
    description: 'Online shopping and product research',
    icon: '🛒',
    color: 'teal',
    rules: [
      { field: 'domain', operator: 'contains', value: ['amazon.', 'ebay.', 'etsy.', 'aliexpress.', 'shopify.'] },
      { field: 'tag', operator: 'contains', value: ['shopping', 'product', 'review', 'price'] },
    ],
  },
  {
    id: 'frequent-visits',
    name: 'Frequent Visits',
    description: 'Sites you visit most often',
    icon: '🔄',
    color: 'indigo',
    rules: [
      { field: 'frequency', operator: 'greaterThan', value: 10 }, // Visited more than 10 times
    ],
  },
]

export function evaluateRule(activity: ActivityLogWithTags, rule: CollectionRule): boolean {
  switch (rule.field) {
    case 'domain':
      if (Array.isArray(rule.value)) {
        return rule.value.some(val => {
          const strVal = String(val).toLowerCase()
          const domain = activity.domain.toLowerCase()
          switch (rule.operator) {
            case 'contains': return domain.includes(strVal)
            case 'equals': return domain === strVal
            case 'startsWith': return domain.startsWith(strVal)
            case 'endsWith': return domain.endsWith(strVal)
            default: return false
          }
        })
      } else {
        const strVal = String(rule.value).toLowerCase()
        const domain = activity.domain.toLowerCase()
        switch (rule.operator) {
          case 'contains': return domain.includes(strVal)
          case 'equals': return domain === strVal
          case 'startsWith': return domain.startsWith(strVal)
          case 'endsWith': return domain.endsWith(strVal)
          default: return false
        }
      }

    case 'tag':
      const tags = activity.tags.map(t => t.toLowerCase())
      if (Array.isArray(rule.value)) {
        return rule.value.some(val => 
          tags.some(tag => tag.includes(String(val).toLowerCase()))
        )
      } else {
        return tags.some(tag => tag.includes(String(rule.value).toLowerCase()))
      }

    case 'title':
      const title = activity.title.toLowerCase()
      const titleVal = String(rule.value).toLowerCase()
      switch (rule.operator) {
        case 'contains': return title.includes(titleVal)
        case 'equals': return title === titleVal
        case 'startsWith': return title.startsWith(titleVal)
        case 'endsWith': return title.endsWith(titleVal)
        default: return false
      }

    case 'time':
      const timeSpent = activity.timeSpent
      if (rule.operator === 'between' && Array.isArray(rule.value) && rule.value.length === 2) {
        return timeSpent >= Number(rule.value[0]) && timeSpent <= Number(rule.value[1])
      } else {
        const numVal = Number(rule.value)
        switch (rule.operator) {
          case 'greaterThan': return timeSpent > numVal
          case 'lessThan': return timeSpent < numVal
          case 'equals': return timeSpent === numVal
          default: return false
        }
      }

    case 'frequency':
      // This requires domain frequency data which we'll calculate separately
      return false

    default:
      return false
  }
}

export function categorizeActivities(
  activities: ActivityLogWithTags[],
  collections: SmartCollection[] = DEFAULT_COLLECTIONS as SmartCollection[]
): SmartCollection[] {
  // Calculate domain frequencies
  const domainFrequency = new Map<string, number>()
  activities.forEach(activity => {
    domainFrequency.set(activity.domain, (domainFrequency.get(activity.domain) || 0) + 1)
  })

  // Categorize activities into collections
  return collections.map(collection => {
    const matchingActivities = activities.filter(activity => {
      // Check if activity matches all rules (AND logic)
      return collection.rules.every(rule => {
        // Special handling for frequency rule
        if (rule.field === 'frequency') {
          const freq = domainFrequency.get(activity.domain) || 0
          return freq > Number(rule.value)
        }
        return evaluateRule(activity, rule)
      })
    })

    return {
      ...collection,
      activities: matchingActivities,
      count: matchingActivities.length,
    }
  })
}

export function createCustomCollection(
  name: string,
  description: string,
  rules: CollectionRule[],
  icon?: string,
  color?: string
): SmartCollection {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    icon: icon || '📁',
    color: color || 'gray',
    rules,
  }
}

export function suggestCollections(activities: ActivityLogWithTags[]): SmartCollection[] {
  const suggestions: SmartCollection[] = []

  // Analyze patterns in activities
  const domainCounts = new Map<string, number>()
  const tagCounts = new Map<string, number>()
  const timePatterns = new Map<string, number[]>()

  activities.forEach(activity => {
    // Count domains
    domainCounts.set(activity.domain, (domainCounts.get(activity.domain) || 0) + 1)
    
    // Count tags
    activity.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })

    // Track time patterns by domain
    if (!timePatterns.has(activity.domain)) {
      timePatterns.set(activity.domain, [])
    }
    timePatterns.get(activity.domain)?.push(activity.timeSpent)
  })

  // Suggest collections based on frequent domains
  const frequentDomains = Array.from(domainCounts.entries())
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  frequentDomains.forEach(([domain, count]) => {
    suggestions.push({
      id: `suggested-domain-${domain}`,
      name: `${domain} Collection`,
      description: `Activities from ${domain} (${count} visits)`,
      icon: '🌐',
      color: 'blue',
      rules: [
        { field: 'domain', operator: 'equals', value: domain }
      ],
    })
  })

  // Suggest collections based on frequent tags
  const frequentTags = Array.from(tagCounts.entries())
    .filter(([, count]) => count > 10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  frequentTags.forEach(([tag, count]) => {
    suggestions.push({
      id: `suggested-tag-${tag}`,
      name: `${tag} Content`,
      description: `Activities tagged with ${tag} (${count} items)`,
      icon: '🏷️',
      color: 'green',
      rules: [
        { field: 'tag', operator: 'contains', value: tag }
      ],
    })
  })

  return suggestions
}
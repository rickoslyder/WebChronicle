import { ActivityLog } from '@/types'
import { format } from 'date-fns'

export function formatActivitiesAsCSV(activities: ActivityLog[], options: {
  includeSummary: boolean
  includeTags: boolean
  includeMetrics: boolean
}): string {
  const headers: string[] = [
    'Date',
    'Time',
    'Title',
    'URL',
    'Domain',
  ]
  
  if (options.includeMetrics) {
    headers.push('Time Spent (s)', 'Scroll Depth (%)', 'Word Count')
  }
  
  if (options.includeSummary) {
    headers.push('Summary')
  }
  
  if (options.includeTags) {
    headers.push('Tags')
  }
  
  const rows = activities.map(activity => {
    const date = new Date(activity.visitedAt)
    const row: string[] = [
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm:ss'),
      escapeCSV(activity.title),
      escapeCSV(activity.url),
      escapeCSV(activity.domain),
    ]
    
    if (options.includeMetrics) {
      row.push(
        activity.timeSpent.toString(),
        activity.scrollDepth ? (activity.scrollDepth * 100).toFixed(1) : '0',
        activity.wordCount?.toString() || '0'
      )
    }
    
    if (options.includeSummary) {
      row.push(escapeCSV(activity.summary || ''))
    }
    
    if (options.includeTags) {
      row.push(escapeCSV(activity.tags?.join(', ') || ''))
    }
    
    return row
  })
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

export function formatActivitiesAsMarkdown(activities: ActivityLog[], options: {
  includeSummary: boolean
  includeTags: boolean
  includeMetrics: boolean
  includeContent: boolean
}): string {
  const sections = activities.map(activity => {
    const date = new Date(activity.visitedAt)
    let section = `## ${activity.title}\n\n`
    section += `**URL:** ${activity.url}\n`
    section += `**Date:** ${format(date, 'PPpp')}\n`
    section += `**Domain:** ${activity.domain}\n`
    
    if (options.includeMetrics) {
      section += `\n### Metrics\n`
      section += `- **Time Spent:** ${formatDuration(activity.timeSpent)}\n`
      section += `- **Scroll Depth:** ${activity.scrollDepth ? (activity.scrollDepth * 100).toFixed(1) : 0}%\n`
      if (activity.wordCount) {
        section += `- **Word Count:** ${activity.wordCount.toLocaleString()}\n`
      }
    }
    
    if (options.includeTags && activity.tags && activity.tags.length > 0) {
      section += `\n### Tags\n`
      section += activity.tags.map(tag => `- ${tag}`).join('\n') + '\n'
    }
    
    if (options.includeSummary && activity.summary) {
      section += `\n### Summary\n${activity.summary}\n`
    }
    
    if (options.includeContent && activity.content) {
      section += `\n### Content\n\`\`\`html\n${activity.content}\n\`\`\`\n`
    }
    
    return section
  })
  
  return `# WebChronicle Export

Generated on ${format(new Date(), 'PPP')}

Total activities: ${activities.length}

---

${sections.join('\n---\n\n')}
`
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}
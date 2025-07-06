'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, BookOpen, Code, Briefcase, Gamepad2, ShoppingCart, MessageSquare, Play } from 'lucide-react'
import { ActivityLogWithTags } from '@/types'
import { cn } from '@/lib/utils'
import { format, subDays, startOfDay } from 'date-fns'

interface ProductivityScoreProps {
  activities: ActivityLogWithTags[]
  days?: number
}

interface CategoryScore {
  category: string
  icon: React.ElementType
  color: string
  time: number
  count: number
  score: number
  percentage: number
}

interface DailyScore {
  date: string
  score: number
  productive: number
  neutral: number
  unproductive: number
}

const CONTENT_CATEGORIES = {
  educational: {
    name: 'Educational',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    score: 1.5,
    keywords: ['tutorial', 'course', 'learn', 'documentation', 'guide', 'education', 'study', 'research'],
    domains: ['coursera.', 'udemy.', 'edx.', 'khanacademy.', 'wikipedia.', 'arxiv.', 'scholar.google.'],
  },
  development: {
    name: 'Development',
    icon: Code,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    score: 1.3,
    keywords: ['programming', 'code', 'development', 'api', 'framework', 'library', 'debug', 'deploy'],
    domains: ['github.', 'stackoverflow.', 'gitlab.', 'bitbucket.', 'npm', 'devdocs.', 'mdn', 'rust-lang.', 'python.org'],
  },
  work: {
    name: 'Work',
    icon: Briefcase,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    score: 1.2,
    keywords: ['business', 'project', 'meeting', 'presentation', 'report', 'analysis', 'productivity'],
    domains: ['slack.', 'teams.', 'zoom.', 'meet.', 'notion.', 'asana.', 'trello.', 'jira.', 'confluence.'],
  },
  entertainment: {
    name: 'Entertainment',
    icon: Play,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    score: 0.5,
    keywords: ['video', 'movie', 'show', 'entertainment', 'watch', 'stream'],
    domains: ['youtube.', 'netflix.', 'twitch.', 'disney', 'hulu.', 'prime', 'vimeo.'],
  },
  social: {
    name: 'Social Media',
    icon: MessageSquare,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    score: 0.3,
    keywords: ['social', 'post', 'tweet', 'share', 'friend', 'follow'],
    domains: ['facebook.', 'twitter.', 'instagram.', 'linkedin.', 'reddit.', 'x.com', 'tiktok.'],
  },
  shopping: {
    name: 'Shopping',
    icon: ShoppingCart,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    score: 0.4,
    keywords: ['shop', 'buy', 'product', 'cart', 'store', 'price', 'deal'],
    domains: ['amazon.', 'ebay.', 'etsy.', 'alibaba.', 'walmart.', 'target.', 'bestbuy.'],
  },
  gaming: {
    name: 'Gaming',
    icon: Gamepad2,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    score: 0.2,
    keywords: ['game', 'play', 'gaming', 'steam', 'epic'],
    domains: ['steam', 'epicgames.', 'blizzard.', 'origin.', 'ubisoft.', 'xbox.', 'playstation.'],
  },
}

function categorizeActivity(activity: ActivityLogWithTags): keyof typeof CONTENT_CATEGORIES | 'other' {
  const url = activity.url.toLowerCase()
  const title = activity.title.toLowerCase()
  const tags = activity.tags.map(t => t.toLowerCase())
  const content = `${url} ${title} ${tags.join(' ')}`

  for (const [key, category] of Object.entries(CONTENT_CATEGORIES)) {
    // Check domains first (more reliable)
    if (category.domains.some(domain => url.includes(domain))) {
      return key as keyof typeof CONTENT_CATEGORIES
    }
    
    // Then check keywords
    if (category.keywords.some(keyword => content.includes(keyword))) {
      return key as keyof typeof CONTENT_CATEGORIES
    }
  }

  return 'other'
}

function calculateProductivityScore(activities: ActivityLogWithTags[]): number {
  if (activities.length === 0) return 0

  let totalWeightedTime = 0
  let totalTime = 0

  activities.forEach(activity => {
    const category = categorizeActivity(activity)
    const categoryData = category === 'other' ? null : CONTENT_CATEGORIES[category]
    const score = categoryData?.score ?? 0.7 // Default score for uncategorized
    
    totalWeightedTime += activity.timeSpent * score
    totalTime += activity.timeSpent
  })

  return totalTime > 0 ? (totalWeightedTime / totalTime) * 100 : 0
}

export function ProductivityScore({ activities, days = 7 }: ProductivityScoreProps) {
  const { categoryScores, dailyScores, overallScore, trend } = useMemo(() => {
    // Filter activities for the time period
    const cutoffDate = startOfDay(subDays(new Date(), days))
    const filteredActivities = activities.filter(
      a => new Date(a.visitedAt) >= cutoffDate
    )

    // Calculate category scores
    const categoryMap = new Map<string, { time: number; count: number }>()
    let totalTime = 0

    filteredActivities.forEach(activity => {
      const category = categorizeActivity(activity)
      const categoryData = category === 'other' 
        ? { name: 'Other', icon: Minus, color: 'text-gray-500', bgColor: 'bg-gray-500/10', score: 0.7 }
        : CONTENT_CATEGORIES[category]

      const current = categoryMap.get(categoryData.name) || { time: 0, count: 0 }
      categoryMap.set(categoryData.name, {
        time: current.time + activity.timeSpent,
        count: current.count + 1,
      })
      totalTime += activity.timeSpent
    })

    const scores: CategoryScore[] = Array.from(categoryMap.entries()).map(([name, data]) => {
      const categoryInfo = Object.values(CONTENT_CATEGORIES).find(c => c.name === name) || 
        { icon: Minus, color: 'text-gray-500', bgColor: 'bg-gray-500/10', score: 0.7 }
      
      return {
        category: name,
        icon: categoryInfo.icon,
        color: categoryInfo.color,
        time: data.time,
        count: data.count,
        score: categoryInfo.score,
        percentage: totalTime > 0 ? (data.time / totalTime) * 100 : 0,
      }
    }).sort((a, b) => b.time - a.time)

    // Calculate daily scores
    const dailyMap = new Map<string, ActivityLogWithTags[]>()
    filteredActivities.forEach(activity => {
      const dateKey = format(new Date(activity.visitedAt), 'yyyy-MM-dd')
      const current = dailyMap.get(dateKey) || []
      dailyMap.set(dateKey, [...current, activity])
    })

    const daily: DailyScore[] = Array.from(dailyMap.entries()).map(([date, acts]) => {
      let productive = 0
      let neutral = 0
      let unproductive = 0

      acts.forEach(activity => {
        const category = categorizeActivity(activity)
        const score = category === 'other' ? 0.7 : CONTENT_CATEGORIES[category].score

        if (score >= 1.0) productive += activity.timeSpent
        else if (score >= 0.6) neutral += activity.timeSpent
        else unproductive += activity.timeSpent
      })

      return {
        date,
        score: calculateProductivityScore(acts),
        productive,
        neutral,
        unproductive,
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate overall score and trend
    const overall = calculateProductivityScore(filteredActivities)
    const recentDays = daily.slice(-3)
    const olderDays = daily.slice(-7, -3)
    const recentAvg = recentDays.reduce((sum, d) => sum + d.score, 0) / (recentDays.length || 1)
    const olderAvg = olderDays.reduce((sum, d) => sum + d.score, 0) / (olderDays.length || 1)
    const trendValue = recentAvg - olderAvg

    return {
      categoryScores: scores,
      dailyScores: daily,
      overallScore: overall,
      trend: trendValue,
    }
  }, [activities, days])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrendIcon = () => {
    if (Math.abs(trend) < 2) return <Minus className="h-5 w-5 text-gray-500" />
    if (trend > 0) return <TrendingUp className="h-5 w-5 text-green-500" />
    return <TrendingDown className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Productivity Score</h3>
        <div className="flex items-center justify-center gap-4">
          <div className={cn('text-5xl font-bold', getScoreColor(overallScore))}>
            {Math.round(overallScore)}
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground">
              {Math.abs(trend) < 2 ? 'Stable' : trend > 0 ? 'Improving' : 'Declining'}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Based on {activities.length} activities over {days} days
        </p>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="text-sm font-medium mb-3">Time by Category</h4>
        <div className="space-y-3">
          {categoryScores.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', category.color)} />
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{Math.round(category.time / 60)}m</span>
                    <span>({category.count} visits)</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-500', category.color.replace('text-', 'bg-'))}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Trend */}
      <div>
        <h4 className="text-sm font-medium mb-3">Daily Productivity</h4>
        <div className="grid grid-cols-7 gap-1">
          {dailyScores.map((day) => (
            <div
              key={day.date}
              className="text-center"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {format(new Date(day.date), 'EEE')}
              </div>
              <div
                className={cn(
                  'h-16 rounded flex items-end justify-center pb-1 text-xs font-medium',
                  day.score >= 80 ? 'bg-green-500/20 text-green-600' :
                  day.score >= 60 ? 'bg-blue-500/20 text-blue-600' :
                  day.score >= 40 ? 'bg-yellow-500/20 text-yellow-600' :
                  'bg-red-500/20 text-red-600'
                )}
              >
                {Math.round(day.score)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>Productivity Score</strong> measures how you spend your time online:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Educational & Development: High productivity (1.3-1.5x)</li>
          <li>Work-related: Productive (1.2x)</li>
          <li>Entertainment & Shopping: Neutral (0.4-0.5x)</li>
          <li>Social Media & Gaming: Low productivity (0.2-0.3x)</li>
        </ul>
      </div>
    </div>
  )
}
'use client'

import { useMemo } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Globe, Award, Target } from 'lucide-react'
import { ActivityLogWithTags } from '@/types'
import { cn } from '@/lib/utils'

interface WeeklyReportProps {
  activities: ActivityLogWithTags[]
  weeks?: number
}

interface WeekStats {
  weekStart: Date
  weekEnd: Date
  totalActivities: number
  totalTime: number
  uniqueDomains: number
  topDomains: Array<{ domain: string; time: number; visits: number }>
  dailyBreakdown: Array<{ date: Date; activities: number; time: number }>
  productivityScore: number
  mostActiveDay: string
  mostActiveHour: number
  goals: {
    readingTime: boolean
    focusTime: boolean
    diverseContent: boolean
  }
}

interface Trend {
  value: number
  direction: 'up' | 'down' | 'stable'
  percentage: number
}

// Goals thresholds
const GOALS = {
  readingTime: 120 * 60, // 2 hours of reading per week
  focusTime: 300 * 60, // 5 hours of focused work per week
  diverseContent: 10, // Visit at least 10 different domains
}

function calculateProductivityScore(activities: ActivityLogWithTags[]): number {
  if (activities.length === 0) return 0

  let totalWeightedTime = 0
  let totalTime = 0

  const productivityWeights: Record<string, number> = {
    educational: 1.5,
    development: 1.3,
    work: 1.2,
    research: 1.4,
    documentation: 1.3,
    entertainment: 0.5,
    social: 0.3,
    shopping: 0.4,
    gaming: 0.2,
  }

  activities.forEach(activity => {
    let weight = 0.7 // default neutral
    
    // Check domain
    const domain = activity.domain.toLowerCase()
    if (domain.includes('github') || domain.includes('stackoverflow')) weight = 1.3
    else if (domain.includes('youtube') || domain.includes('netflix')) weight = 0.5
    else if (domain.includes('twitter') || domain.includes('facebook')) weight = 0.3
    
    // Check tags
    activity.tags.forEach(tag => {
      const tagLower = tag.toLowerCase()
      Object.entries(productivityWeights).forEach(([key, w]) => {
        if (tagLower.includes(key)) weight = Math.max(weight, w)
      })
    })
    
    totalWeightedTime += activity.timeSpent * weight
    totalTime += activity.timeSpent
  })

  return totalTime > 0 ? (totalWeightedTime / totalTime) * 100 : 0
}

export function WeeklyReport({ activities, weeks = 4 }: WeeklyReportProps) {
  const { weeklyStats, trends, currentWeek } = useMemo(() => {
    const now = new Date()
    const stats: WeekStats[] = []

    // Calculate stats for each week
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(now, w))
      const weekEnd = endOfWeek(subWeeks(now, w))
      
      const weekActivities = activities.filter(a => {
        const date = new Date(a.visitedAt)
        return date >= weekStart && date <= weekEnd
      })

      if (weekActivities.length > 0) {
        // Domain stats
        const domainMap = new Map<string, { time: number; visits: number }>()
        weekActivities.forEach(a => {
          const current = domainMap.get(a.domain) || { time: 0, visits: 0 }
          domainMap.set(a.domain, {
            time: current.time + a.timeSpent,
            visits: current.visits + 1,
          })
        })

        const topDomains = Array.from(domainMap.entries())
          .map(([domain, stats]) => ({ domain, ...stats }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5)

        // Daily breakdown
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
        const dailyBreakdown = days.map(day => {
          const dayActivities = weekActivities.filter(a => {
            const actDate = new Date(a.visitedAt)
            return actDate.toDateString() === day.toDateString()
          })
          return {
            date: day,
            activities: dayActivities.length,
            time: dayActivities.reduce((sum, a) => sum + a.timeSpent, 0),
          }
        })

        // Hour distribution
        const hourMap = new Map<number, number>()
        weekActivities.forEach(a => {
          const hour = new Date(a.visitedAt).getHours()
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
        })
        const mostActiveHour = Array.from(hourMap.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 0

        // Calculate goals
        const totalTime = weekActivities.reduce((sum, a) => sum + a.timeSpent, 0)
        const readingTime = weekActivities
          .filter(a => a.tags.some(t => 
            ['article', 'blog', 'documentation', 'tutorial'].includes(t.toLowerCase())
          ))
          .reduce((sum, a) => sum + a.timeSpent, 0)
        
        const focusTime = weekActivities
          .filter(a => a.timeSpent > 300) // Sessions longer than 5 minutes
          .reduce((sum, a) => sum + a.timeSpent, 0)

        stats.push({
          weekStart,
          weekEnd,
          totalActivities: weekActivities.length,
          totalTime,
          uniqueDomains: domainMap.size,
          topDomains,
          dailyBreakdown,
          productivityScore: calculateProductivityScore(weekActivities),
          mostActiveDay: dailyBreakdown
            .sort((a, b) => b.time - a.time)[0]?.date.toLocaleDateString('en-US', { weekday: 'long' }) || 'N/A',
          mostActiveHour,
          goals: {
            readingTime: readingTime >= GOALS.readingTime,
            focusTime: focusTime >= GOALS.focusTime,
            diverseContent: domainMap.size >= GOALS.diverseContent,
          }
        })
      }
    }

    // Calculate trends (comparing last week to previous week)
    const currentWeekData = stats[stats.length - 1]
    const previousWeekData = stats[stats.length - 2]
    
    const calculateTrend = (current?: number, previous?: number): Trend => {
      if (!current || !previous) return { value: current || 0, direction: 'stable', percentage: 0 }
      const diff = current - previous
      const percentage = previous > 0 ? (diff / previous) * 100 : 0
      return {
        value: current,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
        percentage: Math.abs(percentage),
      }
    }

    const trends = {
      activities: calculateTrend(currentWeekData?.totalActivities, previousWeekData?.totalActivities),
      time: calculateTrend(currentWeekData?.totalTime, previousWeekData?.totalTime),
      productivity: calculateTrend(currentWeekData?.productivityScore, previousWeekData?.productivityScore),
      domains: calculateTrend(currentWeekData?.uniqueDomains, previousWeekData?.uniqueDomains),
    }

    return { weeklyStats: stats, trends, currentWeek: currentWeekData }
  }, [activities, weeks])

  const getTrendIcon = (trend: Trend) => {
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  if (!currentWeek) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No activity data available for this period
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Weekly Report</h3>
        <p className="text-sm text-muted-foreground">
          {format(currentWeek.weekStart, 'MMM d')} - {format(currentWeek.weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={Calendar}
          label="Total Activities"
          value={currentWeek.totalActivities.toString()}
          trend={trends.activities}
          getTrendIcon={getTrendIcon}
        />
        <MetricCard
          icon={Clock}
          label="Time Spent"
          value={formatTime(currentWeek.totalTime)}
          trend={trends.time}
          getTrendIcon={getTrendIcon}
        />
        <MetricCard
          icon={Target}
          label="Productivity"
          value={`${Math.round(currentWeek.productivityScore)}%`}
          trend={trends.productivity}
          getTrendIcon={getTrendIcon}
        />
        <MetricCard
          icon={Globe}
          label="Unique Sites"
          value={currentWeek.uniqueDomains.toString()}
          trend={trends.domains}
          getTrendIcon={getTrendIcon}
        />
      </div>

      {/* Goals Achievement */}
      <div>
        <h4 className="text-sm font-medium mb-3">Weekly Goals</h4>
        <div className="space-y-2">
          <GoalItem
            icon={Award}
            label="Reading Time (2h/week)"
            achieved={currentWeek.goals.readingTime}
          />
          <GoalItem
            icon={Target}
            label="Focus Time (5h/week)"
            achieved={currentWeek.goals.focusTime}
          />
          <GoalItem
            icon={Globe}
            label="Content Diversity (10+ sites)"
            achieved={currentWeek.goals.diverseContent}
          />
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div>
        <h4 className="text-sm font-medium mb-3">Daily Activity</h4>
        <div className="grid grid-cols-7 gap-1">
          {currentWeek.dailyBreakdown.map((day, idx) => (
            <div key={idx} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                {format(day.date, 'EEE')}
              </div>
              <div
                className={cn(
                  'h-20 rounded flex flex-col items-center justify-center text-xs',
                  day.activities > 0 ? 'bg-primary/20' : 'bg-muted'
                )}
              >
                <div className="font-medium">{day.activities}</div>
                <div className="text-muted-foreground">
                  {day.time > 0 ? formatTime(day.time) : '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Domains */}
      <div>
        <h4 className="text-sm font-medium mb-3">Top Domains This Week</h4>
        <div className="space-y-2">
          {currentWeek.topDomains.map((domain, idx) => (
            <div key={domain.domain} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{idx + 1}
                </span>
                <span className="text-sm">{domain.domain}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{domain.visits} visits</span>
                <span>{formatTime(domain.time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>Most Active:</strong> {currentWeek.mostActiveDay} at {currentWeek.mostActiveHour}:00
        </p>
        <p>
          <strong>Average per Day:</strong> {Math.round(currentWeek.totalActivities / 7)} activities,{' '}
          {formatTime(currentWeek.totalTime / 7)}
        </p>
      </div>

      {/* Historical Trend */}
      {weeklyStats.length > 1 && (
        <div>
          <h4 className="text-sm font-medium mb-3">4-Week Trend</h4>
          <div className="grid grid-cols-4 gap-2">
            {weeklyStats.map((week, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {format(week.weekStart, 'MMM d')}
                </div>
                <div
                  className={cn(
                    'h-12 rounded flex items-center justify-center text-xs font-medium',
                    'bg-primary/20'
                  )}
                  style={{
                    opacity: 0.4 + (idx / (weeklyStats.length - 1)) * 0.6
                  }}
                >
                  {Math.round(week.productivityScore)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  getTrendIcon
}: { 
  icon: React.ElementType
  label: string
  value: string
  trend: Trend
  getTrendIcon: (trend: Trend) => React.ReactNode
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{value}</div>
        <div className="flex items-center gap-1">
          {getTrendIcon(trend)}
          {trend.percentage > 0 && (
            <span className="text-xs text-muted-foreground">
              {Math.round(trend.percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function GoalItem({ 
  icon: Icon, 
  label, 
  achieved 
}: { 
  icon: React.ElementType
  label: string
  achieved: boolean
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', achieved ? 'text-green-500' : 'text-muted-foreground')} />
        <span className="text-sm">{label}</span>
      </div>
      <div className={cn(
        'text-xs font-medium px-2 py-1 rounded',
        achieved ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
      )}>
        {achieved ? 'Achieved' : 'Not Met'}
      </div>
    </div>
  )
}
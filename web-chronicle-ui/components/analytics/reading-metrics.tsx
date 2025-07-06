'use client'

import { useMemo } from 'react'
import { ActivityLog } from '@/types'
import { BookOpen, Clock, Zap, TrendingUp, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingMetricsProps {
  activities: ActivityLog[]
}

export function ReadingMetrics({ activities }: ReadingMetricsProps) {
  const metrics = useMemo(() => {
    // Filter activities with reading data
    const readingActivities = activities.filter(a => 
      a.wordCount && a.wordCount > 100 && a.timeSpent > 10
    )
    
    if (readingActivities.length === 0) {
      return null
    }
    
    // Calculate reading speeds (words per minute)
    const readingSpeeds = readingActivities.map(activity => ({
      activity,
      wordsPerMinute: (activity.wordCount || 0) / (activity.timeSpent / 60),
      engagementScore: calculateEngagementScore(activity),
    }))
    
    // Overall metrics
    const avgReadingSpeed = readingSpeeds.reduce((sum, r) => sum + r.wordsPerMinute, 0) / readingSpeeds.length
    const avgEngagement = readingSpeeds.reduce((sum, r) => sum + r.engagementScore, 0) / readingSpeeds.length
    
    // Group by speed categories
    const speedCategories = {
      slow: readingSpeeds.filter(r => r.wordsPerMinute < 200).length,
      average: readingSpeeds.filter(r => r.wordsPerMinute >= 200 && r.wordsPerMinute < 300).length,
      fast: readingSpeeds.filter(r => r.wordsPerMinute >= 300 && r.wordsPerMinute < 400).length,
      veryFast: readingSpeeds.filter(r => r.wordsPerMinute >= 400).length,
    }
    
    // Find most engaged content
    const mostEngaged = readingSpeeds
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5)
    
    // Reading time distribution
    const timeDistribution = {
      quick: readingActivities.filter(a => a.timeSpent < 60).length, // < 1 min
      short: readingActivities.filter(a => a.timeSpent >= 60 && a.timeSpent < 300).length, // 1-5 min
      medium: readingActivities.filter(a => a.timeSpent >= 300 && a.timeSpent < 900).length, // 5-15 min
      long: readingActivities.filter(a => a.timeSpent >= 900).length, // > 15 min
    }
    
    return {
      totalArticles: readingActivities.length,
      avgReadingSpeed: Math.round(avgReadingSpeed),
      avgEngagement: Math.round(avgEngagement * 100),
      speedCategories,
      mostEngaged,
      timeDistribution,
      totalReadingTime: readingActivities.reduce((sum, a) => sum + a.timeSpent, 0),
      totalWordsRead: readingActivities.reduce((sum, a) => sum + (a.wordCount || 0), 0),
    }
  }, [activities])
  
  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Not enough reading data available yet.</p>
        <p className="text-sm mt-2">Start reading articles to see your metrics!</p>
      </div>
    )
  }
  
  const getSpeedCategory = (wpm: number) => {
    if (wpm < 200) return { label: 'Slow', color: 'text-orange-500' }
    if (wpm < 300) return { label: 'Average', color: 'text-blue-500' }
    if (wpm < 400) return { label: 'Fast', color: 'text-green-500' }
    return { label: 'Very Fast', color: 'text-purple-500' }
  }
  
  const speedCategory = getSpeedCategory(metrics.avgReadingSpeed)
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Reading Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Insights into your reading habits and comprehension
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Zap}
          label="Reading Speed"
          value={`${metrics.avgReadingSpeed} WPM`}
          subtext={speedCategory.label}
          valueClass={speedCategory.color}
        />
        <MetricCard
          icon={Eye}
          label="Engagement"
          value={`${metrics.avgEngagement}%`}
          subtext="Average score"
          valueClass={metrics.avgEngagement > 70 ? 'text-green-500' : ''}
        />
        <MetricCard
          icon={BookOpen}
          label="Articles Read"
          value={metrics.totalArticles.toLocaleString()}
          subtext={`${Math.round(metrics.totalWordsRead / 1000)}k words`}
        />
        <MetricCard
          icon={Clock}
          label="Reading Time"
          value={formatTime(metrics.totalReadingTime)}
          subtext="Total time"
        />
      </div>
      
      {/* Reading Speed Distribution */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-3">Reading Speed Distribution</h4>
        <div className="space-y-2">
          {Object.entries(metrics.speedCategories).map(([category, count]) => {
            const total = Object.values(metrics.speedCategories).reduce((a, b) => a + b, 0)
            const percentage = (count / total) * 100
            const labels = {
              slow: 'Slow (<200 WPM)',
              average: 'Average (200-300 WPM)',
              fast: 'Fast (300-400 WPM)',
              veryFast: 'Very Fast (>400 WPM)',
            }
            
            return (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{labels[category as keyof typeof labels]}</span>
                  <span className="text-muted-foreground">{count} articles</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Most Engaged Content */}
      <div>
        <h4 className="text-sm font-medium mb-3">Most Engaging Content</h4>
        <div className="space-y-2">
          {metrics.mostEngaged.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex-1 truncate mr-2">
                <span className="font-medium">{item.activity.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {Math.round(item.wordsPerMinute)} WPM
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${item.engagementScore * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.engagementScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reading Insights */}
      <div className="bg-blue-500/10 text-blue-900 dark:text-blue-100 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Reading Insights
        </h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          {metrics.avgReadingSpeed > 300 && (
            <li>You&apos;re a fast reader! Your average speed is above 300 WPM.</li>
          )}
          {metrics.avgEngagement > 70 && (
            <li>You show high engagement with content, spending quality time reading.</li>
          )}
          {metrics.timeDistribution.long > metrics.totalArticles * 0.3 && (
            <li>You prefer in-depth reading, often spending 15+ minutes on articles.</li>
          )}
          {metrics.speedCategories.slow > metrics.totalArticles * 0.4 && (
            <li>You take your time with complex content, ensuring comprehension.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  valueClass = ''
}: { 
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  valueClass?: string
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={cn("text-xl font-bold", valueClass)}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  )
}

function calculateEngagementScore(activity: ActivityLog): number {
  // Engagement score based on multiple factors
  const timeScore = Math.min(activity.timeSpent / 600, 1) // Max at 10 minutes
  const scrollScore = activity.scrollDepth || 0
  const completionScore = activity.timeSpent > 30 && (activity.scrollDepth || 0) > 0.5 ? 1 : 0.5
  
  // Weight the scores
  return (timeScore * 0.3 + scrollScore * 0.5 + completionScore * 0.2)
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
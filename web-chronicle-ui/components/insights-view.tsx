'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Lightbulb, 
  Target,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useAnalytics } from '@/hooks/use-activities'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Insight {
  type: 'productivity' | 'pattern' | 'suggestion' | 'anomaly'
  title: string
  description: string
  metric?: string
  trend?: 'up' | 'down' | 'stable'
}

export function InsightsView() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState(30)
  
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useAnalytics(selectedTimeRange)

  useEffect(() => {
    if (analyticsData) {
      generateInsights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsData, selectedTimeRange])

  const generateInsights = async () => {
    if (!analyticsData) return
    
    setIsGenerating(true)
    
    try {
      const insights: Insight[] = []
      
      // Peak productivity hours
      const peakHour = analyticsData.hourlyDistribution.reduce((max, curr) => 
        curr.count > max.count ? curr : max
      )
      insights.push({
        type: 'productivity',
        title: 'Peak Browsing Hours',
        description: `You're most active between ${peakHour.hour}:00-${peakHour.hour + 1}:00`,
        metric: `${peakHour.count} activities`,
        trend: 'stable'
      })
      
      // Daily average
      const dailyAverage = analyticsData.totalActivities / selectedTimeRange
      insights.push({
        type: 'pattern',
        title: 'Daily Activity Average',
        description: `You visit an average of ${Math.round(dailyAverage)} pages per day`,
        metric: `${Math.round(dailyAverage)} pages/day`,
        trend: dailyAverage > 50 ? 'up' : 'stable'
      })
      
      // Time spent insight
      const avgTimeMinutes = Math.round(analyticsData.averageTimeOnPage / 60)
      insights.push({
        type: 'pattern',
        title: 'Average Reading Time',
        description: `You spend about ${avgTimeMinutes} minutes per page on average`,
        metric: `${avgTimeMinutes} min/page`,
        trend: avgTimeMinutes > 5 ? 'up' : 'down'
      })
      
      // Activity trend
      const recentDays = analyticsData.dailyTrends.slice(-7)
      const previousDays = analyticsData.dailyTrends.slice(-14, -7)
      const recentAvg = recentDays.reduce((sum, d) => sum + d.count, 0) / 7
      const previousAvg = previousDays.reduce((sum, d) => sum + d.count, 0) / 7
      const trendPercentage = ((recentAvg - previousAvg) / previousAvg) * 100
      
      insights.push({
        type: 'anomaly',
        title: 'Weekly Activity Trend',
        description: trendPercentage > 0 
          ? `Your activity increased by ${Math.abs(Math.round(trendPercentage))}% this week`
          : `Your activity decreased by ${Math.abs(Math.round(trendPercentage))}% this week`,
        metric: `${trendPercentage > 0 ? '+' : ''}${Math.round(trendPercentage)}%`,
        trend: trendPercentage > 0 ? 'up' : 'down'
      })
      
      // Productivity suggestion
      if (dailyAverage > 100) {
        insights.push({
          type: 'suggestion',
          title: 'Consider Focused Sessions',
          description: 'With high daily activity, try batching similar tasks to reduce context switching',
        })
      }
      
      // Weekend vs weekday pattern
      const activities = await api.getActivities({ limit: 1000 })
      const weekendActivities = activities.data.filter(a => {
        const day = new Date(a.visitedAt).getDay()
        return day === 0 || day === 6
      })
      const weekdayActivities = activities.data.filter(a => {
        const day = new Date(a.visitedAt).getDay()
        return day > 0 && day < 6
      })
      
      if (weekendActivities.length > weekdayActivities.length / 2.5) {
        insights.push({
          type: 'pattern',
          title: 'Weekend Warrior',
          description: 'You maintain high activity levels even on weekends',
          trend: 'stable'
        })
      }
      
      setInsights(insights)
    } catch (error) {
      console.error('Failed to generate insights:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoadingAnalytics || isGenerating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your browsing patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Insights</h1>
          <p className="text-muted-foreground">
            Intelligent analysis of your browsing patterns and habits
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <button
            onClick={generateInsights}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={BarChart3}
          label="Total Activities"
          value={analyticsData?.totalActivities || 0}
          subtitle={`in ${selectedTimeRange} days`}
        />
        <MetricCard
          icon={Clock}
          label="Avg. Time per Page"
          value={`${Math.round((analyticsData?.averageTimeOnPage || 0) / 60)}m`}
          subtitle="reading time"
        />
        <MetricCard
          icon={Calendar}
          label="Daily Average"
          value={Math.round((analyticsData?.totalActivities || 0) / selectedTimeRange)}
          subtitle="pages per day"
        />
        <MetricCard
          icon={TrendingUp}
          label="Most Active Hour"
          value={`${analyticsData?.hourlyDistribution.reduce((max, curr) => 
            curr.count > max.count ? curr : max
          ).hour || 0}:00`}
          subtitle="peak time"
        />
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle 
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  subtitle: string 
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const iconMap = {
    productivity: Target,
    pattern: BarChart3,
    suggestion: Lightbulb,
    anomaly: TrendingUp,
  }
  
  const Icon = iconMap[insight.type]
  
  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg",
          insight.type === 'productivity' && "bg-blue-500/10 text-blue-500",
          insight.type === 'pattern' && "bg-purple-500/10 text-purple-500",
          insight.type === 'suggestion' && "bg-yellow-500/10 text-yellow-500",
          insight.type === 'anomaly' && "bg-red-500/10 text-red-500"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{insight.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
          
          {insight.metric && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{insight.metric}</span>
              {insight.trend && (
                <TrendingUp className={cn(
                  "h-4 w-4",
                  insight.trend === 'up' && "text-green-500",
                  insight.trend === 'down' && "text-red-500 rotate-180",
                  insight.trend === 'stable' && "text-muted-foreground"
                )} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
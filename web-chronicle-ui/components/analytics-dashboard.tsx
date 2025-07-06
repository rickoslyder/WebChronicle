'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Globe, Tag, Clock, Activity } from 'lucide-react'
import { useAnalytics, useDomainStats, useTagStats, useActivities } from '@/hooks/use-activities'
import { cn } from '@/lib/utils'
import { ActivityHeatmap } from './analytics/activity-heatmap'
import { HourlyHeatmap } from './analytics/hourly-heatmap'
import { ReadingMetrics } from './analytics/reading-metrics'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState(30) // days
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(timeRange)
  const { data: domains, isLoading: domainsLoading } = useDomainStats()
  const { data: tags, isLoading: tagsLoading } = useTagStats()
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities()

  const isLoading = analyticsLoading || domainsLoading || tagsLoading || activitiesLoading
  const allActivities = activitiesData?.pages.flatMap(page => page.data) || []

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted rounded"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  // Process data for charts
  const dailyActivity = analytics?.dailyTrends || []
  const hourlyActivity = analytics?.hourlyDistribution || []
  const topDomains = domains?.slice(0, 6) || []
  const topTags = tags?.slice(0, 8) || []

  // Calculate stats
  const totalActivities = analytics?.totalActivities || 0
  const avgPerDay = totalActivities / timeRange
  const mostActiveHour = hourlyActivity.reduce((max, curr) => 
    curr.count > (max?.count || 0) ? curr : max, hourlyActivity[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-colors",
                timeRange === days
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          icon={Activity}
          label="Total Activities"
          value={totalActivities.toLocaleString()}
          trend={`${avgPerDay.toFixed(1)} per day`}
        />
        <StatsCard
          icon={Clock}
          label="Most Active Hour"
          value={mostActiveHour ? `${mostActiveHour.hour}:00` : 'N/A'}
          trend={mostActiveHour ? `${mostActiveHour.count} activities` : ''}
        />
        <StatsCard
          icon={Globe}
          label="Unique Domains"
          value={domains?.length.toString() || '0'}
          trend="All time"
        />
      </div>

      {/* Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border rounded-lg p-6">
          <ActivityHeatmap activities={allActivities} weeks={12} />
        </div>
        <div className="bg-card border rounded-lg p-6">
          <HourlyHeatmap activities={allActivities} />
        </div>
      </div>

      {/* Reading Metrics */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <ReadingMetrics activities={allActivities} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Trend */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Activity Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity by Hour
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Domains */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Domains
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topDomains}
                dataKey="count"
                nameKey="domain"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ domain, percent }) => 
                  `${domain} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {topDomains.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tags */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Popular Tags
          </h2>
          <div className="space-y-3">
            {topTags.map((tag, index) => {
              const maxCount = topTags[0]?.count || 1
              const percentage = (tag.count / maxCount) * 100
              return (
                <div key={tag.tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{tag.tag}</span>
                    <span className="text-sm text-muted-foreground">{tag.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend 
}: { 
  icon: React.ElementType
  label: string
  value: string
  trend: string
}) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{trend}</p>
    </div>
  )
}
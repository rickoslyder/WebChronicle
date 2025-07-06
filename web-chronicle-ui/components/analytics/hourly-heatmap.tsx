'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { ActivityLog } from '@/types'
import { cn } from '@/lib/utils'

interface HourlyHeatmapProps {
  activities: ActivityLog[]
}

export function HourlyHeatmap({ activities }: HourlyHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Initialize 7x24 grid (days x hours)
    const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    
    activities.forEach(activity => {
      const date = new Date(activity.visitedAt)
      const dayOfWeek = date.getDay() // 0 = Sunday
      const hour = date.getHours()
      grid[dayOfWeek][hour]++
    })
    
    // Find max value for scaling
    const maxValue = Math.max(...grid.flat())
    
    // Convert to percentage
    return grid.map(row => 
      row.map(value => maxValue > 0 ? (value / maxValue) * 100 : 0)
    )
  }, [activities])
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hourLabels = Array.from({ length: 24 }, (_, i) => i)
  
  const getColorIntensity = (percentage: number) => {
    if (percentage === 0) return 'bg-muted'
    if (percentage < 20) return 'bg-primary/20'
    if (percentage < 40) return 'bg-primary/40'
    if (percentage < 60) return 'bg-primary/60'
    if (percentage < 80) return 'bg-primary/80'
    return 'bg-primary'
  }
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am'
    if (hour < 12) return `${hour}am`
    if (hour === 12) return '12pm'
    return `${hour - 12}pm`
  }
  
  // Calculate busiest times
  const busiestTimes = useMemo(() => {
    const times: { day: string; hour: string; percentage: number }[] = []
    
    heatmapData.forEach((row, dayIndex) => {
      row.forEach((percentage, hourIndex) => {
        if (percentage > 0) {
          times.push({
            day: dayLabels[dayIndex],
            hour: formatHour(hourIndex),
            percentage
          })
        }
      })
    })
    
    return times.sort((a, b) => b.percentage - a.percentage).slice(0, 3)
  }, [heatmapData])
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Weekly Activity Pattern</h3>
        <p className="text-sm text-muted-foreground">
          When you're most active throughout the week
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour labels */}
          <div className="flex mb-2 ml-12">
            {hourLabels.map((hour, i) => (
              <div
                key={hour}
                className={cn(
                  "flex-1 text-xs text-center text-muted-foreground",
                  i % 3 === 0 ? 'opacity-100' : 'opacity-0'
                )}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="space-y-1">
            {dayLabels.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-10 text-xs text-muted-foreground text-right">
                  {day}
                </div>
                <div className="flex gap-1 flex-1">
                  {heatmapData[dayIndex].map((percentage, hourIndex) => {
                    const count = Math.round((percentage / 100) * 
                      Math.max(...activities.map(a => {
                        const d = new Date(a.visitedAt)
                        return d.getDay() === dayIndex && d.getHours() === hourIndex ? 1 : 0
                      }).filter(Boolean).length || 1))
                    
                    return (
                      <div
                        key={hourIndex}
                        className={cn(
                          "flex-1 h-5 rounded-sm transition-all cursor-pointer group relative",
                          getColorIntensity(percentage)
                        )}
                        title={`${day} ${formatHour(hourIndex)}: ${count} activities`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="font-medium">{day} {formatHour(hourIndex)}</div>
                          <div>{count} activities</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Time labels for clarity */}
          <div className="flex mt-2 ml-12 text-xs text-muted-foreground">
            <div className="flex-1 text-left">Morning</div>
            <div className="flex-1 text-center">Afternoon</div>
            <div className="flex-1 text-right">Evening</div>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-3">Peak Activity Times</h4>
        <div className="space-y-2">
          {busiestTimes.map((time, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {time.day} at {time.hour}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${time.percentage}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs w-10 text-right">
                  {Math.round(time.percentage)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
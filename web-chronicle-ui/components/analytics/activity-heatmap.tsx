'use client'

import { useMemo } from 'react'
import { format, startOfWeek, addDays, subWeeks, isSameDay } from 'date-fns'
import { ActivityLog } from '@/types'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  activities: ActivityLog[]
  weeks?: number
}

export function ActivityHeatmap({ activities, weeks = 12 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const endDate = new Date()
    const startDate = subWeeks(endDate, weeks)
    
    // Create a map of date -> activity count
    const activityMap = new Map<string, number>()
    
    activities.forEach(activity => {
      const date = format(new Date(activity.visitedAt), 'yyyy-MM-dd')
      activityMap.set(date, (activityMap.get(date) || 0) + 1)
    })
    
    // Generate grid data
    const data: { date: Date; count: number; level: number }[][] = []
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 })
    
    while (currentWeekStart <= endDate) {
      const week: { date: Date; count: number; level: number }[] = []
      
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(currentWeekStart, i)
        if (currentDate > endDate) break
        
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        const count = activityMap.get(dateStr) || 0
        
        // Calculate activity level (0-4)
        let level = 0
        if (count > 0) level = 1
        if (count >= 5) level = 2
        if (count >= 10) level = 3
        if (count >= 20) level = 4
        
        week.push({ date: currentDate, count, level })
      }
      
      if (week.length > 0) {
        data.push(week)
      }
      
      currentWeekStart = addDays(currentWeekStart, 7)
    }
    
    return data
  }, [activities, weeks])
  
  const months = useMemo(() => {
    const monthLabels: { label: string; colStart: number }[] = []
    let lastMonth = ''
    
    heatmapData.forEach((week, weekIndex) => {
      week.forEach(day => {
        const month = format(day.date, 'MMM')
        if (month !== lastMonth) {
          monthLabels.push({ label: month, colStart: weekIndex + 1 })
          lastMonth = month
        }
      })
    })
    
    return monthLabels
  }, [heatmapData])
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted'
      case 1: return 'bg-primary/20'
      case 2: return 'bg-primary/40'
      case 3: return 'bg-primary/60'
      case 4: return 'bg-primary/80'
      default: return 'bg-muted'
    }
  }
  
  const maxCount = Math.max(...heatmapData.flat().map(d => d.count))
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Activity Heatmap</h3>
        <p className="text-sm text-muted-foreground">
          Your browsing activity over the last {weeks} weeks
        </p>
      </div>
      
      <div className="relative">
        {/* Month labels */}
        <div className="flex mb-2 ml-10">
          {months.map((month, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground"
              style={{ 
                position: 'absolute',
                left: `${(month.colStart - 1) * 13 + 40}px`
              }}
            >
              {month.label}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1 mt-6">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-xs text-muted-foreground h-3 flex items-center",
                  i % 2 === 0 ? 'opacity-100' : 'opacity-0'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const isToday = isSameDay(day.date, new Date())
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-all cursor-pointer group relative",
                        getColorClass(day.level),
                        isToday && "ring-1 ring-primary"
                      )}
                      title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} activities`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-medium">{format(day.date, 'MMM d, yyyy')}</div>
                        <div>{day.count} activities</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn("w-3 h-3 rounded-sm", getColorClass(level))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
        
        {/* Stats */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total days</div>
              <div className="font-semibold">{heatmapData.flat().length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Active days</div>
              <div className="font-semibold">
                {heatmapData.flat().filter(d => d.count > 0).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Max activities/day</div>
              <div className="font-semibold">{maxCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
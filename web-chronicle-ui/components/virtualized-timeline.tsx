'use client'

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ActivityLogWithTags } from '@/types'
import { ActivityCard } from './activity-card'
import { groupByDate, groupByDomain } from '@/lib/utils'

interface VirtualizedTimelineProps {
  activities: ActivityLogWithTags[]
  groupBy?: 'none' | 'date' | 'domain'
}

export function VirtualizedTimeline({ activities, groupBy = 'date' }: VirtualizedTimelineProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  // Group activities and flatten into a single array with headers
  const items = useMemo(() => {
    const flattened: Array<{ type: 'header' | 'activity'; content: string | ActivityLogWithTags }> = []
    
    if (groupBy === 'none') {
      activities.forEach(activity => {
        flattened.push({ type: 'activity', content: activity })
      })
    } else if (groupBy === 'domain') {
      const grouped = groupByDomain(activities)
      Array.from(grouped.entries()).forEach(([domain, domainActivities]) => {
        flattened.push({ type: 'header', content: `${domain} (${domainActivities.length})` })
        domainActivities.forEach(activity => {
          flattened.push({ type: 'activity', content: activity })
        })
      })
    } else {
      // Default to date grouping
      const grouped = groupByDate(activities)
      Array.from(grouped.entries()).forEach(([date, dateActivities]) => {
        flattened.push({ type: 'header', content: date })
        dateActivities.forEach(activity => {
          flattened.push({ type: 'activity', content: activity })
        })
      })
    }
    
    return flattened
  }, [activities, groupBy])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index]
      return item.type === 'header' ? 50 : 180 // Estimated heights
    },
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-200px)] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {item.type === 'header' ? (
                <h2 className="text-lg font-semibold text-muted-foreground mb-4 sticky top-0 bg-background/95 backdrop-blur py-2">
                  {item.content === new Date().toDateString() ? 'Today' : item.content as string}
                </h2>
              ) : (
                <ActivityCard activity={item.content as ActivityLogWithTags} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
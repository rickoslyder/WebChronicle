'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Filter as FilterIcon, Loader2 } from 'lucide-react'
import { useActivities } from '@/hooks/use-activities'
import { ActivityCard } from '@/components/activity-card'
import { FilterBar } from '@/components/filter-bar'
import { parseActivityTags, groupByDate } from '@/lib/utils'
import { useActivityStore } from '@/providers/activity-store-provider'

export function Timeline() {
  const viewMode = useActivityStore((state) => state.viewMode)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useActivities()

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Auto-fetch next page when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Listen for refetch events
  useEffect(() => {
    const handleRefetch = () => refetch()
    window.addEventListener('refetch-activities', handleRefetch)
    return () => window.removeEventListener('refetch-activities', handleRefetch)
  }, [refetch])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">
          {error instanceof Error ? error.message : 'Failed to load activities'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  const allActivities = data?.pages.flatMap((page) => page.data) || []
  const activitiesWithTags = allActivities.map(parseActivityTags)

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No activities found. Start browsing to see your activity here!
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Activity Timeline</h1>
        <FilterBar />
      </div>

      {viewMode === 'timeline' && (
        <TimelineView activities={activitiesWithTags} />
      )}
      
      {viewMode === 'grid' && (
        <GridView activities={activitiesWithTags} />
      )}
      
      {viewMode === 'compact' && (
        <CompactView activities={activitiesWithTags} />
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        )}
        {!hasNextPage && allActivities.length > 0 && (
          <p className="text-muted-foreground text-sm">
            You've reached the end of your activities
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineView({ activities }: { activities: any[] }) {
  const groupedActivities = groupByDate(activities)

  return (
    <div className="space-y-8">
      {Array.from(groupedActivities.entries()).map(([date, activities]) => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 sticky top-20 bg-background/95 backdrop-blur py-2">
            {date === new Date().toDateString() ? 'Today' : date}
          </h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GridView({ activities }: { activities: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

function CompactView({ activities }: { activities: any[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} isCompact />
      ))}
    </div>
  )
}
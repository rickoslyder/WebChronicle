'use client'

import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2, CheckSquare, GitCompare, Wifi, WifiOff } from 'lucide-react'
import { useActivities } from '@/hooks/use-activities'
import { useRealtimeActivities } from '@/hooks/use-realtime-activities'
import { ActivityCard } from '@/components/activity-card'
import { FilterBar } from '@/components/filter-bar'
import { VirtualizedTimeline } from '@/components/virtualized-timeline'
import { TimelineSkeleton } from '@/components/activity-skeleton'
import { parseActivityTags, groupByDate, groupByDomain } from '@/lib/utils'
import { useActivityStore } from '@/providers/activity-store-provider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ActivityLogWithTags } from '@/types'

export function Timeline() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isConnected } = useRealtimeActivities()
  const { 
    filter,
    viewMode,
    groupBy,
    isSelectionMode, 
    selectedActivityIds, 
    toggleSelectionMode,
    clearSelection,
    setFilter
  } = useActivityStore((state) => ({
    filter: state.filter,
    viewMode: state.viewMode,
    groupBy: state.groupBy,
    isSelectionMode: state.isSelectionMode,
    selectedActivityIds: state.selectedActivityIds,
    toggleSelectionMode: state.toggleSelectionMode,
    clearSelection: state.clearSelection,
    setFilter: state.setFilter,
  }))

  useEffect(() => {
    setMounted(true)
  }, [])
  
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

  const handleCompare = () => {
    if (selectedActivityIds.size === 2) {
      const [id1, id2] = Array.from(selectedActivityIds)
      router.push(`/compare?id1=${id1}&id2=${id2}`)
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Activity Timeline</h1>
          <FilterBar />
        </div>
        <TimelineSkeleton />
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
  
  // Apply client-side search filter
  const filteredActivities = filter.searchQuery 
    ? allActivities.filter(activity => 
        activity.title.toLowerCase().includes(filter.searchQuery!.toLowerCase()) ||
        activity.url.toLowerCase().includes(filter.searchQuery!.toLowerCase())
      )
    : allActivities
    
  const activitiesWithTags = filteredActivities.map(parseActivityTags)

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No activities found. Start browsing to see your activity here!
        </p>
      </div>
    )
  }

  if (filteredActivities.length === 0 && filter.searchQuery) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Activity Timeline</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                isSelectionMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
            </button>
            <FilterBar />
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No activities match &quot;{filter.searchQuery}&quot;
          </p>
          <button
            onClick={() => setFilter({ ...filter, searchQuery: undefined })}
            className="text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Your Activity Timeline</h1>
          {mounted && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Live updates</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectionMode}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
              isSelectionMode
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </button>
          
          {mounted && isSelectionMode && selectedActivityIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedActivityIds.size} selected
              </span>
              
              {selectedActivityIds.size === 2 && (
                <button
                  onClick={handleCompare}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare
                </button>
              )}
              
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </>
          )}
          
          <FilterBar />
        </div>
      </div>

      {viewMode === 'timeline' && allActivities.length > 50 ? (
        <VirtualizedTimeline activities={activitiesWithTags} groupBy={groupBy} />
      ) : viewMode === 'timeline' ? (
        <TimelineView activities={activitiesWithTags} groupBy={groupBy} />
      ) : viewMode === 'grid' ? (
        <GridView activities={activitiesWithTags} groupBy={groupBy} />
      ) : (
        <CompactView activities={activitiesWithTags} groupBy={groupBy} />
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        )}
        {!hasNextPage && allActivities.length > 0 && (
          <p className="text-muted-foreground text-sm">
            You&apos;ve reached the end of your activities
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineView({ activities, groupBy }: { activities: ActivityLogWithTags[], groupBy: 'none' | 'date' | 'domain' }) {
  if (groupBy === 'none') {
    return (
      <div className="space-y-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    )
  }

  if (groupBy === 'domain') {
    const groupedActivities = groupByDomain(activities)
    return (
      <div className="space-y-8">
        {Array.from(groupedActivities.entries()).map(([domain, domainActivities]) => (
          <div key={domain}>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 sticky top-20 bg-background/95 backdrop-blur py-2 flex items-center gap-2">
              <span>{domain}</span>
              <span className="text-sm font-normal">({domainActivities.length})</span>
            </h2>
            <div className="space-y-4">
              {domainActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default to date grouping
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

function GridView({ activities, groupBy }: { activities: ActivityLogWithTags[], groupBy: 'none' | 'date' | 'domain' }) {
  if (groupBy === 'none') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    )
  }

  if (groupBy === 'domain') {
    const groupedActivities = groupByDomain(activities)
    return (
      <div className="space-y-8">
        {Array.from(groupedActivities.entries()).map(([domain, domainActivities]) => (
          <div key={domain}>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>{domain}</span>
              <span className="text-sm font-normal">({domainActivities.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domainActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default to date grouping
  const groupedActivities = groupByDate(activities)
  return (
    <div className="space-y-8">
      {Array.from(groupedActivities.entries()).map(([date, dateActivities]) => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-muted-foreground mb-4">
            {date === new Date().toDateString() ? 'Today' : date}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dateActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompactView({ activities, groupBy }: { activities: ActivityLogWithTags[], groupBy: 'none' | 'date' | 'domain' }) {
  if (groupBy === 'none') {
    return (
      <div className="border rounded-lg overflow-hidden">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} isCompact />
        ))}
      </div>
    )
  }

  if (groupBy === 'domain') {
    const groupedActivities = groupByDomain(activities)
    return (
      <div className="space-y-6">
        {Array.from(groupedActivities.entries()).map(([domain, domainActivities]) => (
          <div key={domain}>
            <h2 className="text-lg font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <span>{domain}</span>
              <span className="text-sm font-normal">({domainActivities.length})</span>
            </h2>
            <div className="border rounded-lg overflow-hidden">
              {domainActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} isCompact />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default to date grouping
  const groupedActivities = groupByDate(activities)
  return (
    <div className="space-y-6">
      {Array.from(groupedActivities.entries()).map(([date, dateActivities]) => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">
            {date === new Date().toDateString() ? 'Today' : date}
          </h2>
          <div className="border rounded-lg overflow-hidden">
            {dateActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} isCompact />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
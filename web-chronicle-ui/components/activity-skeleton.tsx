export function ActivitySkeleton() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="flex items-center gap-4">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="h-8 w-8 bg-muted rounded" />
      </div>
      
      <div className="flex items-center gap-6 mb-3">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
      
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-muted rounded-full w-16" />
        <div className="h-6 bg-muted rounded-full w-20" />
        <div className="h-6 bg-muted rounded-full w-18" />
      </div>
      
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded w-28" />
        <div className="h-8 bg-muted rounded w-24" />
      </div>
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, groupIndex) => (
        <div key={groupIndex}>
          <div className="h-6 bg-muted rounded w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
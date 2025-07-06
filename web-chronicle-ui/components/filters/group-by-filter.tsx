'use client'

import { Layers2, Calendar, Globe } from 'lucide-react'
import { useActivityStore } from '@/providers/activity-store-provider'
import { cn } from '@/lib/utils'

export function GroupByFilter() {
  const { groupBy, setGroupBy } = useActivityStore()

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Layers2 className="h-4 w-4" />
        Group By
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => setGroupBy('none')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
            groupBy === 'none'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent hover:text-accent-foreground"
          )}
        >
          None
        </button>
        <button
          onClick={() => setGroupBy('date')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
            groupBy === 'date'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Calendar className="h-4 w-4" />
          Date
        </button>
        <button
          onClick={() => setGroupBy('domain')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
            groupBy === 'domain'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Globe className="h-4 w-4" />
          Domain
        </button>
      </div>
    </div>
  )
}
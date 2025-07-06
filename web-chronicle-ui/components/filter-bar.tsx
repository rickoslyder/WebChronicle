'use client'

import { useState } from 'react'
import { 
  Filter, 
  Calendar, 
  Globe, 
  Tag, 
  X,
  LayoutGrid,
  List,
  LayoutList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActivityStore } from '@/providers/activity-store-provider'
import { DateFilter } from './filters/date-filter'
import { DomainFilter } from './filters/domain-filter'
import { TagFilter } from './filters/tag-filter'

export function FilterBar() {
  const [showFilters, setShowFilters] = useState(false)
  const { filter, viewMode, setViewMode } = useActivityStore()
  
  const hasActiveFilters = !!(
    filter.dateRange || 
    filter.domains?.length || 
    filter.tags?.length
  )

  return (
    <div className="flex items-center gap-2">
      {/* View mode selector */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
        <button
          onClick={() => setViewMode('timeline')}
          className={cn(
            "p-2 rounded transition-colors",
            viewMode === 'timeline' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Timeline view"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={cn(
            "p-2 rounded transition-colors",
            viewMode === 'grid' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('compact')}
          className={cn(
            "p-2 rounded transition-colors",
            viewMode === 'compact' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Compact view"
        >
          <LayoutList className="h-4 w-4" />
        </button>
      </div>

      {/* Filter button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          hasActiveFilters
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded text-xs">
            Active
          </span>
        )}
      </button>

      {/* Filter dropdown */}
      {showFilters && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <DateFilter />
            <DomainFilter />
            <TagFilter />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => useActivityStore.getState().clearFilter()}
              className="w-full mt-4 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
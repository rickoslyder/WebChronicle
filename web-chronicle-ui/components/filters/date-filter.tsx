'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { useActivityStore } from '@/providers/activity-store-provider'
import { cn } from '@/lib/utils'

export function DateFilter() {
  const filter = useActivityStore((state) => state.filter)
  const setFilter = useActivityStore((state) => state.setFilter)
  const [showCustom, setShowCustom] = useState(false)

  const handlePreset = (days: number | 'all') => {
    if (days === 'all') {
      setFilter({ ...filter, dateRange: undefined })
      setShowCustom(false)
      return
    }
    
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    
    setFilter({
      ...filter,
      dateRange: { from, to }
    })
    setShowCustom(false)
  }

  const handleCustomDate = (type: 'from' | 'to', value: string) => {
    if (!value) return
    
    const date = new Date(value)
    const currentRange = filter.dateRange || { from: new Date(), to: new Date() }
    
    setFilter({
      ...filter,
      dateRange: {
        ...currentRange,
        [type]: date
      }
    })
  }

  const isPresetActive = (days: number | 'all') => {
    if (!filter.dateRange && days === 'all') return true
    if (!filter.dateRange || days === 'all') return false
    
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - filter.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    return Math.abs(daysDiff - days) < 1
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Calendar className="h-4 w-4" />
        Date Range
      </label>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePreset('all')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              isPresetActive('all')
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            All
          </button>
          <button
            onClick={() => handlePreset(7)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              isPresetActive(7)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            7 days
          </button>
          <button
            onClick={() => handlePreset(30)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              isPresetActive(30)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            30 days
          </button>
        </div>
        
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        >
          Custom range
        </button>
        
        {showCustom && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filter.dateRange?.from.toISOString().split('T')[0] || ''}
              onChange={(e) => handleCustomDate('from', e.target.value)}
              className="px-2 py-1.5 text-sm border rounded-md bg-background"
              placeholder="From"
            />
            <input
              type="date"
              value={filter.dateRange?.to.toISOString().split('T')[0] || ''}
              onChange={(e) => handleCustomDate('to', e.target.value)}
              className="px-2 py-1.5 text-sm border rounded-md bg-background"
              placeholder="To"
            />
          </div>
        )}
      </div>
    </div>
  )
}
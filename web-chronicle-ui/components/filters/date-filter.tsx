'use client'

import { Calendar } from 'lucide-react'
import { useActivityStore } from '@/providers/activity-store-provider'

export function DateFilter() {
  const { filter, setFilter } = useActivityStore()

  const handlePreset = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    
    setFilter({
      dateRange: { from, to }
    })
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Calendar className="h-4 w-4" />
        Date Range
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handlePreset(1)}
          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        >
          Today
        </button>
        <button
          onClick={() => handlePreset(7)}
          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        >
          7 days
        </button>
        <button
          onClick={() => handlePreset(30)}
          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        >
          30 days
        </button>
      </div>
    </div>
  )
}
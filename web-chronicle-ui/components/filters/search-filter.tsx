'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useActivityStore } from '@/providers/activity-store-provider'
import debounce from 'lodash.debounce'

export function SearchFilter() {
  const { filter, setFilter } = useActivityStore()
  const [inputValue, setInputValue] = useState(filter.searchQuery || '')

  // Debounced filter update
  const debouncedSetFilter = useCallback(
    debounce((value: string) => {
      setFilter({ 
        ...filter, 
        searchQuery: value || undefined 
      })
    }, 300),
    [filter]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    debouncedSetFilter(value)
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Search className="h-4 w-4" />
        Quick Search
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search activities..."
        className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Filter by title or URL
      </p>
    </div>
  )
}
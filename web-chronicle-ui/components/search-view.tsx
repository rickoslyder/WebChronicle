'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useSearch } from '@/hooks/use-activities'
import { ActivityCard } from '@/components/activity-card'
import { parseActivityTags } from '@/lib/utils'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'

export function SearchView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [inputValue, setInputValue] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [isExpanded, setIsExpanded] = useState(false)
  const [limit, setLimit] = useState(20)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isError, error, refetch } = useSearch(query, limit)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQuery(value)
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    if (query) {
      refetch()
    }
  }

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by content, meaning, or topic..."
          value={inputValue}
          onChange={handleInputChange}
          className="w-full pl-10 pr-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          data-search-input
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Advanced options */}
      <div className="mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Advanced options
        </button>
        
        {isExpanded && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Results limit
              </label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleLimitChange(num)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      limit === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isError && (
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle className="h-5 w-5" />
          <p>{error instanceof Error ? error.message : 'Search failed'}</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Found {data.length} result{data.length === 1 ? '' : 's'}
          </h2>
          <div className="space-y-4">
            {data.map((result) => {
              const activity = parseActivityTags(result.activity)
              return (
                <div key={result.activity.id} className="relative">
                  <ActivityCard activity={activity} />
                  <div className="absolute top-2 right-2 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    {Math.round(result.score * 100)}% match
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data && data.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            No results found for "{query}"
          </p>
          <p className="text-sm text-muted-foreground">
            Try different keywords or broader search terms
          </p>
        </div>
      )}

      {!query && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Enter a search query to find activities
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Examples: "react hooks", "authentication", "performance optimization"
          </p>
        </div>
      )}
    </div>
  )
}
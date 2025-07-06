'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, FileText, Link, Calendar, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivityLog } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ActivityItem } from '@/components/activity-item'

interface SearchOptions {
  searchTitle: boolean
  searchUrl: boolean
  searchSummary: boolean
  searchTags: boolean
  searchContent: boolean
  caseSensitive: boolean
  wholeWord: boolean
}

interface SearchResult extends ActivityLog {
  matches: {
    field: string
    snippet: string
    position: number
  }[]
}

export function FullTextSearch() {
  const [query, setQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<SearchOptions>({
    searchTitle: true,
    searchUrl: true,
    searchSummary: true,
    searchTags: true,
    searchContent: false,
    caseSensitive: false,
    wholeWord: false,
  })
  
  const debouncedQuery = useDebounce(query, 300)
  
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: ['full-text-search', debouncedQuery, options],
    queryFn: async ({ pageParam = 0 }) => {
      if (!debouncedQuery.trim()) {
        return { results: [], nextCursor: null }
      }
      
      const searchParams = new URLSearchParams({
        q: debouncedQuery,
        page: pageParam.toString(),
        limit: '20',
        ...Object.entries(options).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value.toString()
        }), {})
      })
      
      const response = await fetch(`/api/search/fulltext?${searchParams}`)
      if (!response.ok) throw new Error('Search failed')
      
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: debouncedQuery.length > 0,
    initialPageParam: 0,
  })
  
  const results = useMemo(() => 
    data?.pages.flatMap(page => page.results) || [],
    [data]
  )
  
  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    
    const regex = options.wholeWord 
      ? new RegExp(`\\b(${escapeRegex(highlight)})\\b`, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(`(${escapeRegex(highlight)})`, options.caseSensitive ? 'g' : 'gi')
    
    const parts = text.split(regex)
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 text-foreground px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  }
  
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in your browsing history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        
        {/* Search Options */}
        <details className="border rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-sm">Search Options</summary>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchTitle"
                  checked={options.searchTitle}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, searchTitle: checked as boolean }))
                  }
                />
                <Label htmlFor="searchTitle" className="text-sm">Title</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchUrl"
                  checked={options.searchUrl}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, searchUrl: checked as boolean }))
                  }
                />
                <Label htmlFor="searchUrl" className="text-sm">URL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchSummary"
                  checked={options.searchSummary}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, searchSummary: checked as boolean }))
                  }
                />
                <Label htmlFor="searchSummary" className="text-sm">Summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchTags"
                  checked={options.searchTags}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, searchTags: checked as boolean }))
                  }
                />
                <Label htmlFor="searchTags" className="text-sm">Tags</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="searchContent"
                  checked={options.searchContent}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, searchContent: checked as boolean }))
                  }
                />
                <Label htmlFor="searchContent" className="text-sm">Full Content</Label>
              </div>
            </div>
            
            <div className="flex gap-4 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="caseSensitive"
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, caseSensitive: checked as boolean }))
                  }
                />
                <Label htmlFor="caseSensitive" className="text-sm">Case Sensitive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wholeWord"
                  checked={options.wholeWord}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, wholeWord: checked as boolean }))
                  }
                />
                <Label htmlFor="wholeWord" className="text-sm">Whole Word</Label>
              </div>
            </div>
          </div>
        </details>
      </div>
      
      {/* Results */}
      {query && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isLoading ? 'Searching...' : `${results.length} results found`}
            </h3>
            {results.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Searching in: {Object.entries(options)
                  .filter(([key, value]) => key.startsWith('search') && value)
                  .map(([key]) => key.replace('search', ''))
                  .join(', ')}
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {results.map((result: SearchResult) => (
              <div key={result.id} className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(result.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {expandedItems.has(result.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <h4 className="font-medium text-sm line-clamp-1">
                          {highlightMatch(result.title, query)}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link className="h-3 w-3" />
                        <span className="line-clamp-1">
                          {highlightMatch(result.url, query)}
                        </span>
                      </div>
                      
                      {/* Match previews */}
                      <div className="space-y-1">
                        {result.matches.slice(0, 2).map((match, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            <span className="font-medium">{match.field}:</span>{' '}
                            <span className="italic">
                              &quot;...{highlightMatch(match.snippet, query)}...&quot;
                            </span>
                          </div>
                        ))}
                        {result.matches.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{result.matches.length - 2} more matches
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {highlightMatch(tag, query)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground ml-4">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(result.visitedAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {expandedItems.has(result.id) && (
                  <div className="border-t p-4 bg-muted/30">
                    <ActivityItem activity={result} viewMode="timeline" />
                    
                    {/* All matches */}
                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium">All Matches:</h5>
                      {result.matches.map((match, i) => (
                        <div key={i} className="text-sm bg-background rounded p-2">
                          <span className="font-medium text-muted-foreground">
                            {match.field} (position {match.position}):
                          </span>
                          <div className="mt-1 italic">
                            &quot;...{highlightMatch(match.snippet, query)}...&quot;
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetching}
                variant="outline"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
          
          {!isLoading && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-2">Try adjusting your search options or query</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
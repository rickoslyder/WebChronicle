'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, HelpCircle, X, Plus } from 'lucide-react'
import { parseQuery, applyQueryToActivities } from '@/lib/query-parser'
import { ActivityLog } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AdvancedSearchProps {
  activities: ActivityLog[]
  onSearch: (results: ActivityLog[], query: string) => void
  className?: string
}

interface SearchExample {
  query: string
  description: string
}

const SEARCH_EXAMPLES: SearchExample[] = [
  { query: 'javascript tutorial', description: 'Simple text search' },
  { query: 'domain:github.com', description: 'Search by domain' },
  { query: 'tag:programming', description: 'Search by tag' },
  { query: 'title:"React hooks"', description: 'Exact title match' },
  { query: 'after:7d', description: 'Last 7 days' },
  { query: 'time:>300', description: 'Sessions over 5 minutes' },
  { query: 'javascript AND tutorial', description: 'Both terms required' },
  { query: 'react NOT redux', description: 'Exclude terms' },
  { query: 'domain:github.com after:30d tag:typescript', description: 'Complex query' },
]

export function AdvancedSearch({ activities, onSearch, className }: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [parsedTokens, setParsedTokens] = useState<ReturnType<typeof parseQuery>['tokens']>([])
  const [error, setError] = useState<string | null>(null)

  const performSearch = useCallback(() => {
    try {
      setError(null)
      const parsed = parseQuery(query)
      setParsedTokens(parsed.tokens)
      const results = applyQueryToActivities(activities, parsed)
      onSearch(results, query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid query')
      setParsedTokens([])
    }
  }, [query, activities, onSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch()
      } else {
        setParsedTokens([])
        onSearch(activities, '')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activities, onSearch, performSearch])

  const insertExample = (example: string) => {
    setQuery(example)
    setShowExamples(false)
  }

  const getTokenColor = (token: ReturnType<typeof parseQuery>['tokens'][0]) => {
    switch (token.type) {
      case 'operator':
        return 'bg-purple-500/20 text-purple-600'
      case 'field':
        return 'bg-blue-500/20 text-blue-600'
      case 'quoted':
        return 'bg-green-500/20 text-green-600'
      case 'date':
        return 'bg-orange-500/20 text-orange-600'
      default:
        return 'bg-gray-500/20 text-gray-600'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search with advanced syntax..."
          className="pl-10 pr-20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              performSearch()
            }
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="h-7 w-7 p-0"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Parsed Tokens */}
      {parsedTokens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Parsed:</span>
          {parsedTokens.map((token, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className={cn('text-xs', getTokenColor(token))}
            >
              {token.field && `${token.field}:`}
              {token.value}
            </Badge>
          ))}
        </div>
      )}

      {/* Help Section */}
      {showHelp && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Search Syntax Guide</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs"
            >
              {showExamples ? 'Hide' : 'Show'} Examples
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Field Searches</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>domain:</code> - Search by website</li>
                <li><code>title:</code> - Search in page titles</li>
                <li><code>tag:</code> - Search by tags</li>
                <li><code>time:</code> - Filter by time spent</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">Date Filters</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>after:</code> - Activities after date</li>
                <li><code>before:</code> - Activities before date</li>
                <li>Use: <code>today</code>, <code>7d</code>, <code>30d</code></li>
                <li>Or: <code>2024-01-15</code></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">Operators</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>AND</code> - Both terms required</li>
                <li><code>OR</code> - Either term</li>
                <li><code>NOT</code> - Exclude term</li>
                <li><code>&quot;quotes&quot;</code> - Exact phrase</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">Time Filters</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>time:&gt;300</code> - More than 5 min</li>
                <li><code>time:&lt;60</code> - Less than 1 min</li>
                <li><code>time:60-300</code> - Between 1-5 min</li>
              </ul>
            </div>
          </div>

          {/* Examples */}
          {showExamples && (
            <div className="border-t pt-4">
              <h5 className="font-medium mb-2">Example Queries</h5>
              <div className="space-y-2">
                {SEARCH_EXAMPLES.map((example, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => insertExample(example.query)}
                  >
                    <div>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                        {example.query}
                      </code>
                      <span className="text-xs text-muted-foreground ml-2">
                        {example.description}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
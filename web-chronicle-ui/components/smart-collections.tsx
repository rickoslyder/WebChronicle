'use client'

import { useState, useMemo } from 'react'
import { Plus, Sparkles, ChevronRight } from 'lucide-react'
import { useActivities } from '@/hooks/use-activities'
import { 
  categorizeActivities, 
  DEFAULT_COLLECTIONS, 
  suggestCollections,
  type SmartCollection 
} from '@/lib/smart-collections'
import { ActivityLogWithTags } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivityCard } from './activity-card'

export function SmartCollections() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [expandedActivities, setExpandedActivities] = useState(false)
  
  // Get all activities
  const { data: activitiesData, isLoading } = useActivities()
  const allActivities = activitiesData?.pages.flatMap(page => page.data) || []
  const activitiesWithTags: ActivityLogWithTags[] = allActivities.map(activity => ({
    ...activity,
    tags: activity.tags || []
  }))

  // Categorize activities into collections
  const collections = useMemo(() => {
    return categorizeActivities(activitiesWithTags, DEFAULT_COLLECTIONS as SmartCollection[])
  }, [activitiesWithTags])

  // Get suggested collections
  const suggestions = useMemo(() => {
    if (!showSuggestions) return []
    return suggestCollections(activitiesWithTags)
  }, [activitiesWithTags, showSuggestions])

  const selectedCollectionData = collections.find(c => c.id === selectedCollection) ||
    suggestions.find(s => s.id === selectedCollection)

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
      green: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
      yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
      pink: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
      orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
      teal: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
      indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
      gray: { bg: 'bg-gray-50 dark:bg-gray-950/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
    }
    return colorMap[color] || colorMap.gray
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Collections</h1>
          <p className="text-muted-foreground">
            Automatically organized groups based on your browsing patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => {
          const colors = getColorClasses(collection.color)
          const isSelected = selectedCollection === collection.id
          
          return (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(isSelected ? null : collection.id)}
              className={cn(
                'text-left p-6 rounded-lg border transition-all',
                colors.bg,
                colors.border,
                isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{collection.icon}</span>
                <Badge variant="secondary" className="text-xs">
                  {collection.count || 0}
                </Badge>
              </div>
              <h3 className={cn('font-semibold mb-1', colors.text)}>
                {collection.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {collection.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Suggested Collections */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Suggested Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => {
              const colors = getColorClasses(suggestion.color)
              const isSelected = selectedCollection === suggestion.id
              
              return (
                <button
                  key={suggestion.id}
                  onClick={() => setSelectedCollection(isSelected ? null : suggestion.id)}
                  className={cn(
                    'text-left p-4 rounded-lg border transition-all',
                    colors.bg,
                    colors.border,
                    isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md',
                    'opacity-90'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <Badge variant="outline" className="text-xs">
                      Suggested
                    </Badge>
                  </div>
                  <h3 className={cn('font-medium text-sm mb-1', colors.text)}>
                    {suggestion.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Collection Details */}
      {selectedCollectionData && selectedCollectionData.activities && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCollectionData.icon}</span>
              <div>
                <h2 className="text-xl font-semibold">{selectedCollectionData.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCollectionData.count} activities • {selectedCollectionData.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedActivities(!expandedActivities)}
            >
              {expandedActivities ? 'Show Less' : 'Show All'}
              <ChevronRight className={cn(
                'h-4 w-4 ml-1 transition-transform',
                expandedActivities && 'rotate-90'
              )} />
            </Button>
          </div>

          {/* Collection Rules */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Rules:</span>
            {selectedCollectionData.rules.map((rule, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {rule.field} {rule.operator} {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
              </Badge>
            ))}
          </div>

          {/* Activities */}
          <div className="space-y-2">
            {selectedCollectionData.activities
              .slice(0, expandedActivities ? undefined : 5)
              .map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
          </div>

          {selectedCollectionData.activities.length > 5 && !expandedActivities && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedActivities(true)}
              >
                Show {selectedCollectionData.activities.length - 5} more activities
              </Button>
            </div>
          )}

          {selectedCollectionData.activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No activities match this collection&apos;s rules
            </div>
          )}
        </div>
      )}
    </div>
  )
}
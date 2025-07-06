'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText, Code } from 'lucide-react'
import { SearchView } from './search-view'
import { FullTextSearch } from './search/full-text-search'
import { AdvancedSearch } from './search/advanced-search'
import { useActivities } from '@/hooks/use-activities'
import { ActivityLogWithTags } from '@/types'
import { ActivityCard } from './activity-card'

export function EnhancedSearchView() {
  const [activeTab, setActiveTab] = useState('semantic')
  const [advancedResults, setAdvancedResults] = useState<ActivityLogWithTags[]>([])
  const [advancedQuery, setAdvancedQuery] = useState('')
  
  // Get all activities for advanced search
  const { data: activitiesData } = useActivities()
  const allActivities = activitiesData?.pages.flatMap(page => page.data) || []
  const activitiesWithTags: ActivityLogWithTags[] = allActivities.map(activity => ({
    ...activity,
    tags: activity.tags || []
  }))
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Your Activities</h1>
        <p className="text-muted-foreground">
          Choose between AI-powered semantic search, full-text search, or advanced query syntax
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="semantic" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Semantic Search
          </TabsTrigger>
          <TabsTrigger value="fulltext" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full-Text Search
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Advanced Query
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="semantic" className="mt-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              AI-Powered Semantic Search
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Uses AI to understand meaning and context. Finds relevant content even when exact words don&apos;t match.
              Great for conceptual searches like &quot;authentication best practices&quot; or &quot;performance optimization&quot;.
            </p>
          </div>
          <SearchView />
        </TabsContent>
        
        <TabsContent value="fulltext" className="mt-6">
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
              Traditional Full-Text Search
            </h3>
            <p className="text-sm text-green-700 dark:text-green-200">
              Searches for exact words and phrases across titles, URLs, summaries, tags, and optionally full content.
              Perfect for finding specific terms, code snippets, or exact phrases you remember.
            </p>
          </div>
          <FullTextSearch />
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
              Advanced Query Syntax
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-200">
              Use powerful query operators to build complex searches. Filter by domain, tags, date ranges, time spent,
              and combine terms with AND, OR, NOT operators.
            </p>
          </div>
          
          <AdvancedSearch
            activities={activitiesWithTags}
            onSearch={(results, query) => {
              const resultsWithTags = results.map(r => ({
                ...r,
                tags: r.tags || []
              }))
              setAdvancedResults(resultsWithTags)
              setAdvancedQuery(query)
            }}
            className="mb-6"
          />
          
          {/* Results */}
          {advancedQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {advancedResults.length} {advancedResults.length === 1 ? 'result' : 'results'}
                </h3>
                <span className="text-sm text-muted-foreground">
                  Query: <code className="bg-muted px-2 py-1 rounded">{advancedQuery}</code>
                </span>
              </div>
              
              <div className="space-y-2">
                {advancedResults.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                  />
                ))}
              </div>
              
              {advancedResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activities match your query
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
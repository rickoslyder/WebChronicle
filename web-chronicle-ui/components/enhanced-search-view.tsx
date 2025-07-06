'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText } from 'lucide-react'
import { SearchView } from './search-view'
import { FullTextSearch } from './search/full-text-search'

export function EnhancedSearchView() {
  const [activeTab, setActiveTab] = useState('semantic')
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Your Activities</h1>
        <p className="text-muted-foreground">
          Choose between AI-powered semantic search or traditional full-text search
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="semantic" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Semantic Search
          </TabsTrigger>
          <TabsTrigger value="fulltext" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full-Text Search
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
      </Tabs>
    </div>
  )
}
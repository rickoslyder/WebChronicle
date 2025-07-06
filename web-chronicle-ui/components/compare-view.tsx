'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, SplitSquareHorizontal, FileText, Loader2 } from 'lucide-react'
import { useActivity } from '@/hooks/use-activities'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DiffView } from './diff-view'

export function CompareView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')
  
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const [content1, setContent1] = useState<string>('')
  const [content2, setContent2] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [error, setError] = useState<string>('')

  const { data: activity1, isLoading: isLoading1 } = useActivity(id1 || '')
  const { data: activity2, isLoading: isLoading2 } = useActivity(id2 || '')

  useEffect(() => {
    async function loadContent() {
      if (!id1 || !id2) return
      
      setIsLoadingContent(true)
      setError('')
      
      try {
        const [content1Data, content2Data] = await Promise.all([
          api.getContent(id1),
          api.getContent(id2)
        ])
        
        setContent1(content1Data.content || '')
        setContent2(content2Data.content || '')
      } catch (err) {
        setError('Failed to load content for comparison')
        console.error(err)
      } finally {
        setIsLoadingContent(false)
      }
    }

    loadContent()
  }, [id1, id2])

  if (!id1 || !id2) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Please select two activities to compare
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Timeline
        </button>
      </div>
    )
  }

  const isLoading = isLoading1 || isLoading2 || isLoadingContent

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Compare Activities</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
              viewMode === 'split'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
            Split View
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
              viewMode === 'unified'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <FileText className="h-4 w-4" />
            Unified View
          </button>
        </div>
      </div>

      {/* Activity Info */}
      {!isLoading && activity1 && activity2 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-card border rounded-lg">
            <h3 className="font-semibold mb-2">{activity1.title}</h3>
            <p className="text-sm text-muted-foreground">{activity1.domain}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity1.visitedAt).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <h3 className="font-semibold mb-2">{activity2.title}</h3>
            <p className="text-sm text-muted-foreground">{activity2.domain}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity2.visitedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      )}

      {!isLoading && !error && content1 && content2 && (
        <DiffView
          content1={content1}
          content2={content2}
          title1={activity1?.title || 'Activity 1'}
          title2={activity2?.title || 'Activity 2'}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
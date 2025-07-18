'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  Globe, 
  ScrollText, 
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  FileDown,
  Share2
} from 'lucide-react'
import { ActivityLogWithTags } from '@/types'
import { cn, formatDate, formatDuration, getRelativeTime } from '@/lib/utils'
import { useSummary } from '@/hooks/use-activities'
import { useSettingsStore } from '@/stores/settings-store'
import { useActivityStore } from '@/providers/activity-store-provider'
import { useHoverDelay } from '@/hooks/use-hover-delay'
import { ScreenshotPreview } from '@/components/screenshot-preview'
import { ActivityDetailDrawer } from '@/components/activity-detail-drawer'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface ActivityCardProps {
  activity: ActivityLogWithTags
  isCompact?: boolean
}

export function ActivityCard({ activity, isCompact = false }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const showSummaries = useSettingsStore((state) => state.showSummaries)
  const showScreenshots = useSettingsStore((state) => state.showScreenshots ?? true)
  const { 
    isSelectionMode, 
    selectedActivityIds, 
    toggleActivitySelection 
  } = useActivityStore((state) => ({
    isSelectionMode: state.isSelectionMode,
    selectedActivityIds: state.selectedActivityIds,
    toggleActivitySelection: state.toggleActivitySelection,
  }))
  
  const isSelected = mounted ? selectedActivityIds.has(activity.id) : false
  
  const {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    cleanup
  } = useHoverDelay({ enterDelay: 800, leaveDelay: 300 })

  useEffect(() => {
    setMounted(true)
    return cleanup
  }, [cleanup])
  
  const { data: summaryData, isLoading: isSummaryLoading } = useSummary(
    isExpanded && showSummaries ? activity.id : ''
  )

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleFindSimilar = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate to search page with the activity title as query
    const searchQuery = encodeURIComponent(activity.title || activity.url)
    router.push(`/search?q=${searchQuery}`)
  }

  const handleArchivePdf = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const blob = await api.generatePdf(activity.url)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date(activity.visitedAt).toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleClick = () => {
    if (isSelectionMode) {
      toggleActivitySelection(activity.id)
    } else {
      setShowDetailDrawer(true)
    }
  }
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const shareText = `Check out this interesting article: ${activity.title}`
    const shareUrl = activity.url
    
    // Use native share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.title,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        toast.success('Link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  if (isCompact) {
    return (
      <>
        <div 
          className={cn(
            "flex items-center justify-between p-3 border-b hover:bg-accent/50 transition-colors cursor-pointer",
            isSelectionMode && isSelected && "bg-accent/50"
          )}
          onClick={handleClick}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{activity.title}</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {activity.domain}
              </span>
              <span>{getRelativeTime(activity.visitedAt)}</span>
            </div>
          </div>
          {isSelectionMode && (
            <div 
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center mr-2",
                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
          )}
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-accent rounded-md transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <ActivityDetailDrawer
          activity={activity}
          isOpen={showDetailDrawer}
          onClose={() => setShowDetailDrawer(false)}
        />
      </>
    )
  }

  return (
    <div 
      ref={cardRef}
      className={cn(
        "border rounded-lg p-4 hover:shadow-md transition-shadow animate-in relative cursor-pointer",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div 
          className={cn(
            "absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
          )}
        >
          {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold line-clamp-2 mb-1">
            {activity.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {activity.domain}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(activity.visitedAt)}
            </span>
          </div>
        </div>
        <a
          href={activity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-accent rounded-md transition-colors ml-2"
          title="Open in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(activity.timeOnPage)}
        </span>
        <span className="flex items-center gap-1">
          <ScrollText className="h-3 w-3" />
          {Math.round(activity.scrollDepth * 100)}% scrolled
        </span>
      </div>

      {/* Tags */}
      {activity.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activity.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleFindSimilar}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
          title="Find similar activities"
        >
          <Search className="h-4 w-4" />
          Find Similar
        </button>
        <button
          onClick={handleArchivePdf}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
          title="Save as PDF"
        >
          <FileDown className="h-4 w-4" />
          Save PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
          title="Share activity"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Summary Section */}
      {showSummaries && (
        <div>
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide summary
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show summary
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              {isSummaryLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-background/50 rounded animate-pulse" />
                  <div className="h-4 bg-background/50 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-background/50 rounded animate-pulse w-3/5" />
                </div>
              ) : summaryData?.summary ? (
                <p className="text-sm leading-relaxed">{summaryData.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No summary available
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Screenshot Preview */}
      {showScreenshots && mounted && isHovered && !isSelectionMode && (
        <div className="pointer-events-none absolute top-0 left-full ml-4 z-50">
          <ScreenshotPreview 
            url={activity.url} 
            title={activity.title}
          />
        </div>
      )}
      
      {/* Detail Drawer */}
      <ActivityDetailDrawer
        activity={activity}
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
      />
    </div>
  )
}
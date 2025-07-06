'use client'

import { useEffect, useState } from 'react'
import { X, Calendar, Clock, Globe, Tag, ExternalLink, FileText, Hash, Edit3, Save, Share2, Copy, Check } from 'lucide-react'
import { ActivityLogWithTags } from '@/types'
import { formatDate, formatDuration, extractDomain } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useActivityNotes } from '@/hooks/use-activity-notes'

interface ActivityDetailDrawerProps {
  activity: ActivityLogWithTags | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDetailDrawer({ activity, isOpen, onClose }: ActivityDetailDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesInput, setNotesInput] = useState('')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  
  const { notes, updateNotes, isUpdating } = useActivityNotes(activity?.id || '')

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (notes) {
      setNotesInput(notes)
    }
  }, [notes])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSaveNotes = () => {
    updateNotes(notesInput)
    setIsEditingNotes(false)
  }
  
  const handleCancelEdit = () => {
    setNotesInput(notes || '')
    setIsEditingNotes(false)
  }
  
  const handleCopyLink = async () => {
    if (!activity) return
    
    try {
      await navigator.clipboard.writeText(activity.url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }
  
  const handleShare = async (platform: 'twitter' | 'email' | 'copy') => {
    if (!activity) return
    
    const shareText = `Check out this interesting article: ${activity.title}`
    const shareUrl = activity.url
    
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        )
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(activity.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        break
      case 'copy':
        try {
          const shareContent = `${shareText}\n\n${shareUrl}`
          await navigator.clipboard.writeText(shareContent)
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 2000)
        } catch (error) {
          console.error('Failed to copy:', error)
        }
        break
    }
    
    setShowShareMenu(false)
  }

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background border-l shadow-lg transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {activity && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Activity Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Title and URL */}
                <div>
                  <h3 className="text-lg font-medium mb-2">{activity.title}</h3>
                  <a
                    href={activity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate">{activity.url}</span>
                  </a>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(activity.visitedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(activity.timeSpent)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{extractDomain(activity.url)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activity.scrollDepth !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{Math.round(activity.scrollDepth * 100)}% read</span>
                      </div>
                    )}
                    {activity.wordCount && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span>{activity.wordCount.toLocaleString()} words</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {activity.tags && activity.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted text-sm rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {activity.summary && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Summary</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Personal Notes</h4>
                    {!isEditingNotes ? (
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="p-1 hover:bg-accent rounded-md transition-colors"
                        title="Edit notes"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveNotes}
                          disabled={isUpdating}
                          className="p-1 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                          title="Save notes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="p-1 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Add your personal notes about this activity..."
                      className="w-full min-h-[100px] p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isUpdating}
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md min-h-[100px]">
                      {notes ? (
                        <p className="text-sm whitespace-pre-wrap">{notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No notes yet. Click the edit button to add notes.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Additional Information</h4>
                  <dl className="space-y-2">
                    <div className="text-sm">
                      <dt className="inline font-medium">Activity ID: </dt>
                      <dd className="inline text-muted-foreground font-mono">{activity.id}</dd>
                    </div>
                    {activity.contentHash && (
                      <div className="text-sm">
                        <dt className="inline font-medium">Content Hash: </dt>
                        <dd className="inline text-muted-foreground font-mono text-xs">
                          {activity.contentHash.substring(0, 16)}...
                        </dd>
                      </div>
                    )}
                    <div className="text-sm">
                      <dt className="inline font-medium">Created: </dt>
                      <dd className="inline text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <div className="flex gap-3 mb-3">
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Page
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-md transition-colors"
                  title="Copy link"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share Activity
                </button>
                
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-md shadow-lg p-2">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                    >
                      Share via Email
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                    >
                      Copy Share Text
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="w-full mt-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
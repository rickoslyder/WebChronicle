'use client'

import { Tag } from 'lucide-react'
import { useTagStats } from '@/hooks/use-activities'
import { useActivityStore } from '@/providers/activity-store-provider'

export function TagFilter() {
  const { data: tags, isLoading } = useTagStats()
  const filter = useActivityStore((state) => state.filter)
  const setFilter = useActivityStore((state) => state.setFilter)
  
  const selectedTags = filter.tags || []

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    
    setFilter({ tags: newTags })
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Tag className="h-4 w-4" />
        Tags
      </label>
      
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {tags?.slice(0, 10).map((tag) => (
            <label
              key={tag.tag}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.tag)}
                onChange={() => toggleTag(tag.tag)}
                className="rounded border-input"
              />
              <span>{tag.tag}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                ({tag.count})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
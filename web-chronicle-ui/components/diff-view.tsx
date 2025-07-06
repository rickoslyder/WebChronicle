'use client'

import { useMemo } from 'react'
import { diffLines } from 'diff'
import { cn } from '@/lib/utils'

interface DiffViewProps {
  content1: string
  content2: string
  title1: string
  title2: string
  viewMode: 'split' | 'unified'
}

export function DiffView({ content1, content2, title1, title2, viewMode }: DiffViewProps) {
  const changes = useMemo(() => {
    return diffLines(content1, content2, { ignoreWhitespace: false })
  }, [content1, content2])

  if (viewMode === 'unified') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 border-b">
          <h3 className="font-mono text-sm">
            Comparing: {title1} ↔ {title2}
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono">
            {changes.map((change, index) => (
              <div
                key={index}
                className={cn(
                  "px-2 py-0.5",
                  change.added && "bg-green-500/20 text-green-700 dark:text-green-400",
                  change.removed && "bg-red-500/20 text-red-700 dark:text-red-400",
                  !change.added && !change.removed && "text-muted-foreground"
                )}
              >
                {change.added && '+ '}
                {change.removed && '- '}
                {!change.added && !change.removed && '  '}
                {change.value}
              </div>
            ))}
          </pre>
        </div>
      </div>
    )
  }

  // Split view
  const lines1: Array<{ line: string; type: 'removed' | 'unchanged' }> = []
  const lines2: Array<{ line: string; type: 'added' | 'unchanged' }> = []

  changes.forEach((change) => {
    const lines = change.value.split('\n').filter(line => line)
    
    if (change.removed) {
      lines.forEach(line => {
        lines1.push({ line, type: 'removed' })
        lines2.push({ line: '', type: 'unchanged' })
      })
    } else if (change.added) {
      lines.forEach(line => {
        lines1.push({ line: '', type: 'unchanged' })
        lines2.push({ line, type: 'added' })
      })
    } else {
      lines.forEach(line => {
        lines1.push({ line, type: 'unchanged' })
        lines2.push({ line, type: 'unchanged' })
      })
    }
  })

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left side */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 border-b">
          <h3 className="font-semibold text-sm truncate">{title1}</h3>
        </div>
        <div className="overflow-x-auto">
          <pre className="text-sm font-mono p-4">
            {lines1.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "min-h-[1.5em] px-2",
                  item.type === 'removed' && "bg-red-500/20 text-red-700 dark:text-red-400"
                )}
              >
                {item.line || '\u00A0'}
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* Right side */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 border-b">
          <h3 className="font-semibold text-sm truncate">{title2}</h3>
        </div>
        <div className="overflow-x-auto">
          <pre className="text-sm font-mono p-4">
            {lines2.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "min-h-[1.5em] px-2",
                  item.type === 'added' && "bg-green-500/20 text-green-700 dark:text-green-400"
                )}
              >
                {item.line || '\u00A0'}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}
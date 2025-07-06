'use client'

import { useState } from 'react'
import { 
  FileDown, 
  MoreVertical,
  FileJson,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface BatchOperationsProps {
  selectedIds: string[]
}

export function BatchOperations({ selectedIds }: BatchOperationsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    
    try {
      // Fetch full details for selected activities
      const activities = await Promise.all(
        selectedIds.map(id => api.getActivity(id))
      )
      
      if (format === 'json') {
        const dataStr = JSON.stringify(activities, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        downloadBlob(blob, `selected-activities-${Date.now()}.json`)
      } else {
        const headers = ['ID', 'Title', 'URL', 'Domain', 'Visited At', 'Time Spent (s)', 'Scroll Depth (%)']
        const rows = activities.map(activity => [
          activity.id,
          `"${activity.title.replace(/"/g, '""')}"`,
          `"${activity.url}"`,
          activity.domain,
          new Date(activity.visitedAt).toISOString(),
          activity.timeOnPage,
          Math.round(activity.scrollDepth * 100)
        ].join(','))
        
        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        downloadBlob(blob, `selected-activities-${Date.now()}.csv`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export activities. Please try again.')
    } finally {
      setIsExporting(false)
      setShowMenu(false)
    }
  }

  const handleBatchPdf = async () => {
    setIsExporting(true)
    
    try {
      for (const id of selectedIds) {
        const activity = await api.getActivity(id)
        const blob = await api.generatePdf(activity.url)
        
        const filename = `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date(activity.visitedAt).toISOString().split('T')[0]}.pdf`
        downloadBlob(blob, filename)
        
        // Add delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDFs. Please try again.')
    } finally {
      setIsExporting(false)
      setShowMenu(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors",
          isExporting && "opacity-50 cursor-not-allowed"
        )}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
        <span>Actions</span>
      </button>
      
      {showMenu && !isExporting && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-background border rounded-lg shadow-lg py-1 z-50">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
          >
            <FileJson className="h-4 w-4" />
            Export as JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </button>
          <button
            onClick={handleBatchPdf}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
          >
            <FileDown className="h-4 w-4" />
            Save all as PDFs
          </button>
        </div>
      )}
    </div>
  )
}
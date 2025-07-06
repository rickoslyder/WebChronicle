'use client'

import { useState } from 'react'
import { Download, FileJson, FileText, Table, Calendar, Filter, Loader2 } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ExportOptions {
  format: 'json' | 'csv' | 'markdown'
  includeContent: boolean
  includeSummary: boolean
  includeTags: boolean
  includeMetrics: boolean
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  customStartDate?: Date
  customEndDate?: Date
}

export function DataExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeContent: false,
    includeSummary: true,
    includeTags: true,
    includeMetrics: true,
    dateRange: 'all',
  })
  const { toast } = useToast()
  
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        format: options.format,
        includeContent: options.includeContent.toString(),
        includeSummary: options.includeSummary.toString(),
        includeTags: options.includeTags.toString(),
        includeMetrics: options.includeMetrics.toString(),
        dateRange: options.dateRange,
      })
      
      if (options.dateRange === 'custom' && options.customStartDate && options.customEndDate) {
        params.append('startDate', options.customStartDate.toISOString())
        params.append('endDate', options.customEndDate.toISOString())
      }
      
      const response = await fetch(`/api/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const filename = `webchronicle-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.${options.format}`
      
      // Download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Export successful',
        description: `Your data has been exported as ${filename}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }
  
  const getDateRangeLabel = () => {
    switch (options.dateRange) {
      case 'today':
        return format(new Date(), 'MMM d, yyyy')
      case 'week':
        return `${format(subDays(new Date(), 7), 'MMM d')} - ${format(new Date(), 'MMM d, yyyy')}`
      case 'month':
        return `${format(subDays(new Date(), 30), 'MMM d')} - ${format(new Date(), 'MMM d, yyyy')}`
      case 'custom':
        if (options.customStartDate && options.customEndDate) {
          return `${format(options.customStartDate, 'MMM d')} - ${format(options.customEndDate, 'MMM d, yyyy')}`
        }
        return 'Select dates'
      default:
        return 'All time'
    }
  }
  
  const formatIcons = {
    json: <FileJson className="h-5 w-5" />,
    csv: <Table className="h-5 w-5" />,
    markdown: <FileText className="h-5 w-5" />,
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Export Your Data</h2>
        <p className="text-muted-foreground">
          Download your browsing history in various formats for backup or analysis
        </p>
      </div>
      
      {/* Format Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Export Format</Label>
        <RadioGroup
          value={options.format}
          onValueChange={(value: string) => setOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['json', 'csv', 'markdown'] as const).map((format) => (
              <label
                key={format}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  options.format === format
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={format} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {formatIcons[format]}
                    <span className="font-medium uppercase">{format}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format === 'json' && 'Complete data with nested structure'}
                    {format === 'csv' && 'Spreadsheet-compatible format'}
                    {format === 'markdown' && 'Human-readable formatted text'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>
      
      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Date Range</Label>
        <Select
          value={options.dateRange}
          onValueChange={(value: string) => setOptions(prev => ({ ...prev, dateRange: value as ExportOptions['dateRange'] }))}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Exporting: {getDateRangeLabel()}
        </p>
      </div>
      
      {/* Data Options */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Include Data</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSummary"
              checked={options.includeSummary}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeSummary: checked as boolean }))
              }
            />
            <Label htmlFor="includeSummary" className="font-normal cursor-pointer">
              AI Summaries
              <span className="text-sm text-muted-foreground ml-2">
                Include AI-generated summaries of pages
              </span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTags"
              checked={options.includeTags}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeTags: checked as boolean }))
              }
            />
            <Label htmlFor="includeTags" className="font-normal cursor-pointer">
              Tags
              <span className="text-sm text-muted-foreground ml-2">
                Include auto-generated and custom tags
              </span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeMetrics"
              checked={options.includeMetrics}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeMetrics: checked as boolean }))
              }
            />
            <Label htmlFor="includeMetrics" className="font-normal cursor-pointer">
              Reading Metrics
              <span className="text-sm text-muted-foreground ml-2">
                Time spent, scroll depth, word count
              </span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeContent"
              checked={options.includeContent}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeContent: checked as boolean }))
              }
              disabled={options.format === 'csv'}
            />
            <Label 
              htmlFor="includeContent" 
              className={cn(
                "font-normal cursor-pointer",
                options.format === 'csv' && "opacity-50 cursor-not-allowed"
              )}
            >
              Full Page Content
              <span className="text-sm text-muted-foreground ml-2">
                {options.format === 'csv' 
                  ? 'Not available for CSV format'
                  : 'Include complete HTML content (large file size)'
                }
              </span>
            </Label>
          </div>
        </div>
      </div>
      
      {/* Export Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          <Filter className="h-4 w-4 inline mr-1" />
          Export will include all activities matching your current filters
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          size="lg"
          className="min-w-[150px]"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
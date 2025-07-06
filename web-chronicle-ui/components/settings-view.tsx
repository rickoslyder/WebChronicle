'use client'

import { useState } from 'react'
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Database,
  FileJson,
  FileSpreadsheet
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { ActivityLog } from '@/types'

export function SettingsView() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [importError, setImportError] = useState<string>('')
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      // In a real app, this would persist to a server
      await new Promise(resolve => setTimeout(resolve, 500))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleExport = () => {
    const data = exportSettings()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webchronicle-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        importSettings(data)
        setImportError('')
      } catch (error) {
        setImportError('Invalid settings file')
      }
    }
    reader.readAsText(file)
  }

  const exportActivitiesToJSON = (activities: ActivityLog[]) => {
    const dataStr = JSON.stringify(activities, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webchronicle-activities-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportActivitiesToCSV = (activities: ActivityLog[]) => {
    // CSV header
    const headers = ['ID', 'Title', 'URL', 'Domain', 'Visited At', 'Time Spent (s)', 'Scroll Depth (%)', 'Content Length', 'Tags']
    
    // Convert activities to CSV rows
    const rows = activities.map(activity => {
      const tags = activity.tagsJson ? JSON.parse(activity.tagsJson).join('; ') : ''
      return [
        activity.id,
        `"${activity.title.replace(/"/g, '""')}"`,
        `"${activity.url}"`,
        activity.domain,
        new Date(activity.visitedAt).toISOString(),
        activity.timeOnPage,
        Math.round(activity.scrollDepth * 100),
        activity.contentLength,
        `"${tags}"`
      ].join(',')
    })
    
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webchronicle-activities-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDataExport = async () => {
    setExportStatus('exporting')
    
    try {
      // Fetch all activities (increase limit to get more data)
      const response = await api.getActivities({ limit: 1000 })
      const activities = response.data
      
      if (exportFormat === 'json') {
        exportActivitiesToJSON(activities)
      } else {
        exportActivitiesToCSV(activities)
      }
      
      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 2000)
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 3000)
    }
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* API Configuration */}
        <section className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Worker URL
              </label>
              <input
                type="url"
                value={settings.workerUrl}
                onChange={(e) => updateSettings({ workerUrl: e.target.value })}
                placeholder="https://your-worker.workers.dev"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Auth Token
              </label>
              <input
                type="password"
                value={settings.authToken}
                onChange={(e) => updateSettings({ authToken: e.target.value })}
                placeholder="Your authentication token"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Display Preferences */}
        <section className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Display Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ theme: value as any })}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors",
                      settings.theme === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Default View
              </label>
              <select
                value={settings.defaultView}
                onChange={(e) => updateSettings({ defaultView: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="timeline">Timeline</option>
                <option value="analytics">Analytics</option>
                <option value="search">Search</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">
                  Auto Refresh
                </label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh activities every 30 seconds
                </p>
              </div>
              <button
                onClick={() => updateSettings({ autoRefresh: !settings.autoRefresh })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  settings.autoRefresh ? "bg-primary" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                    settings.autoRefresh ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">
                  Show Summaries
                </label>
                <p className="text-xs text-muted-foreground">
                  Display AI-generated summaries in activity cards
                </p>
              </div>
              <button
                onClick={() => updateSettings({ showSummaries: !settings.showSummaries })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  settings.showSummaries ? "bg-primary" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                    settings.showSummaries ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">
                  Show Screenshot Previews
                </label>
                <p className="text-xs text-muted-foreground">
                  Display screenshot preview on hover for activities
                </p>
              </div>
              <button
                onClick={() => updateSettings({ showScreenshots: !settings.showScreenshots })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  settings.showScreenshots ? "bg-primary" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                    settings.showScreenshots ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Import/Export */}
        <section className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Import/Export Settings</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Settings
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                Import Settings
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            
            {importError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {importError}
              </div>
            )}
          </div>
        </section>

        {/* Data Export */}
        <section className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Export Activity Data</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your activity history data for backup or analysis purposes.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors",
                    exportFormat === 'json'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileJson className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors",
                    exportFormat === 'csv'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDataExport}
              disabled={exportStatus === 'exporting'}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-colors w-full justify-center",
                exportStatus === 'exporting' && "opacity-50 cursor-not-allowed",
                exportStatus === 'success' 
                  ? "bg-green-600 text-white" 
                  : exportStatus === 'error'
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {exportStatus === 'exporting' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exporting...
                </>
              ) : exportStatus === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Exported Successfully
                </>
              ) : exportStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Export Failed
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Export All Activities
                </>
              )}
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              saveStatus === 'saving' && "opacity-50 cursor-not-allowed",
              saveStatus === 'saved' 
                ? "bg-green-600 text-white" 
                : saveStatus === 'error'
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Error
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
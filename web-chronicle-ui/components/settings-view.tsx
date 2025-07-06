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
  Monitor
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'

export function SettingsView() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [importError, setImportError] = useState<string>('')

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
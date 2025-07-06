'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ScreenshotPreviewProps {
  url: string
  title: string
  className?: string
}

export function ScreenshotPreview({ url, title, className }: ScreenshotPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    async function loadScreenshot() {
      try {
        setIsLoading(true)
        setError(false)
        
        // First check if we have a cached screenshot in localStorage
        const cacheKey = `screenshot:${url}`
        const cached = localStorage.getItem(cacheKey)
        
        if (cached && mounted) {
          setImageUrl(cached)
          setIsLoading(false)
          return
        }

        // Fetch new screenshot
        const blob = await api.getScreenshot(url)
        
        if (!mounted) return
        
        // Convert blob to data URL for caching
        const reader = new FileReader()
        reader.onloadend = () => {
          if (mounted && reader.result) {
            const dataUrl = reader.result as string
            setImageUrl(dataUrl)
            
            // Cache in localStorage (with size limit check)
            try {
              if (dataUrl.length < 500000) { // 500KB limit
                localStorage.setItem(cacheKey, dataUrl)
              }
            } catch (e) {
              // Ignore storage errors
              console.warn('Failed to cache screenshot:', e)
            }
          }
        }
        reader.readAsDataURL(blob)
      } catch (err) {
        console.error('Failed to load screenshot:', err)
        if (mounted) {
          setError(true)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadScreenshot()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [url])

  if (error) {
    return null
  }

  return (
    <div 
      className={cn(
        "absolute z-50 w-96 h-64 bg-card border rounded-lg shadow-lg overflow-hidden",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-muted">
          <p className="text-muted-foreground">Preview unavailable</p>
        </div>
      )}
    </div>
  )
}
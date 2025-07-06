'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered:', registration)
          })
          .catch(error => {
            console.log('SW registration failed:', error)
          })
      })
    }

    // Monitor online/offline status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
      setShowOfflineNotice(!navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initial check
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    if (isOnline && showOfflineNotice) {
      // Hide notice after 3 seconds when back online
      const timer = setTimeout(() => {
        setShowOfflineNotice(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineNotice])

  return (
    <>
      {children}
      
      {/* Offline/Online Status Banner */}
      {showOfflineNotice && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium transition-all ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                Back online
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                You&apos;re offline - Some features may be limited
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
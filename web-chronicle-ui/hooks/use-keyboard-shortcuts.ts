import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  handler: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const matchesCtrl = !shortcut.ctrlKey || event.ctrlKey
        const matchesMeta = !shortcut.metaKey || event.metaKey
        const matchesShift = !shortcut.shiftKey || event.shiftKey
        
        if (matchesKey && matchesCtrl && matchesMeta && matchesShift) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function useGlobalKeyboardShortcuts() {
  const router = useRouter()
  
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true, // Cmd on Mac, Ctrl on Windows/Linux
      handler: () => {
        // Focus search input
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          // Navigate to search page if no search input is visible
          router.push('/search')
        }
      }
    },
    {
      key: 'Escape',
      handler: () => {
        // Clear selection mode if active
        const event = new CustomEvent('clear-selection-mode')
        window.dispatchEvent(event)
        
        // Blur any focused input
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.blur) {
          activeElement.blur()
        }
      }
    }
  ])
}
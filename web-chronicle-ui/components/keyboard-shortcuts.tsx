'use client'

import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useActivityStore } from '@/providers/activity-store-provider'
import { useEffect } from 'react'

export function KeyboardShortcuts() {
  useGlobalKeyboardShortcuts()
  
  const clearSelection = useActivityStore((state) => state.clearSelection)
  const isSelectionMode = useActivityStore((state) => state.isSelectionMode)
  const toggleSelectionMode = useActivityStore((state) => state.toggleSelectionMode)
  
  useEffect(() => {
    // Listen for clear selection mode event
    const handleClearSelectionMode = () => {
      clearSelection()
      if (isSelectionMode) {
        toggleSelectionMode() // Turn off selection mode
      }
    }
    
    window.addEventListener('clear-selection-mode', handleClearSelectionMode)
    return () => window.removeEventListener('clear-selection-mode', handleClearSelectionMode)
  }, [clearSelection, isSelectionMode, toggleSelectionMode])
  
  return null
}
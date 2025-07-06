'use client'

import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useActivityStore } from '@/providers/activity-store-provider'
import { useEffect } from 'react'

export function KeyboardShortcuts() {
  useGlobalKeyboardShortcuts()
  
  const clearSelection = useActivityStore((state) => state.clearSelection)
  const setSelectionMode = useActivityStore((state) => state.setSelectionMode)
  
  useEffect(() => {
    // Listen for clear selection mode event
    const handleClearSelectionMode = () => {
      clearSelection()
      setSelectionMode(false)
    }
    
    window.addEventListener('clear-selection-mode', handleClearSelectionMode)
    return () => window.removeEventListener('clear-selection-mode', handleClearSelectionMode)
  }, [clearSelection, setSelectionMode])
  
  return null
}
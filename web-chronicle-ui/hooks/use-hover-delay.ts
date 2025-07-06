import { useState, useCallback, useRef } from 'react'

interface UseHoverDelayOptions {
  enterDelay?: number
  leaveDelay?: number
}

export function useHoverDelay(options: UseHoverDelayOptions = {}) {
  const { enterDelay = 500, leaveDelay = 300 } = options
  const [isHovered, setIsHovered] = useState(false)
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(() => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }

    // Set enter timeout
    enterTimeoutRef.current = setTimeout(() => {
      setIsHovered(true)
    }, enterDelay)
  }, [enterDelay])

  const handleMouseLeave = useCallback(() => {
    // Clear any pending enter timeout
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }

    // Set leave timeout
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, leaveDelay)
  }, [leaveDelay])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }
  }, [])

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    cleanup,
  }
}
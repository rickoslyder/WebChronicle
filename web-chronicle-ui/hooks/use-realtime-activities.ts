'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ActivityLog } from '@/types'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from 'sonner'

interface RealtimeActivityEvent {
  type: 'new_activity' | 'update_activity' | 'delete_activity'
  data: ActivityLog
}

export function useRealtimeActivities() {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: RealtimeActivityEvent = JSON.parse(event.data)
      
      switch (message.type) {
        case 'new_activity':
          // Invalidate the activities query to refetch with the new activity
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities })
          
          // Show a toast notification
          toast('New activity logged', {
            description: message.data.title,
            duration: 3000,
          })
          break
          
        case 'update_activity':
          // Update the specific activity in the cache
          queryClient.setQueriesData(
            { queryKey: QUERY_KEYS.activities },
            (oldData: any) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  data: page.data.map((activity: ActivityLog) =>
                    activity.id === message.data.id ? message.data : activity
                  ),
                })),
              }
            }
          )
          break
          
        case 'delete_activity':
          // Remove the activity from the cache
          queryClient.setQueriesData(
            { queryKey: QUERY_KEYS.activities },
            (oldData: any) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  data: page.data.filter(
                    (activity: ActivityLog) => activity.id !== message.data.id
                  ),
                })),
              }
            }
          )
          break
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [queryClient])

  const connect = useCallback(() => {
    // Get WebSocket URL from environment or construct from current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${window.location.host}/ws`
    
    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttemptsRef.current = 0
        
        // Send authentication if needed
        const authToken = localStorage.getItem('authToken')
        if (authToken) {
          wsRef.current?.send(JSON.stringify({
            type: 'auth',
            token: authToken,
          }))
        }
      }
      
      wsRef.current.onmessage = handleMessage
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        
        // Implement exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect... (attempt ${reconnectAttemptsRef.current})`)
          connect()
        }, backoffDelay)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [handleMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    // Only connect if we're in the browser and have a valid URL
    if (typeof window !== 'undefined' && !wsRef.current) {
      // For now, we'll skip WebSocket connection if the backend doesn't support it
      // This can be enabled when the backend implements WebSocket support
      // connect()
    }
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnectAttempts: reconnectAttemptsRef.current,
  }
}
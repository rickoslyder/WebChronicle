import { useState, useEffect, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function dispatch(action: { type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST'; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      memoryState = {
        ...memoryState,
        toasts: [action.toast!, ...memoryState.toasts],
      }
      break
    case 'UPDATE_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      }
      break
    case 'DISMISS_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      }
      break
    case 'REMOVE_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
      }
      break
  }
  
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)
  
  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])
  
  const toast = useCallback(
    ({ ...props }: Omit<Toast, 'id'>) => {
      const id = String(++toastCount)
      const toast = { ...props, id }
      
      dispatch({ type: 'ADD_TOAST', toast })
      
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', toastId: id })
      }, 5000)
      
      return id
    },
    []
  )
  
  const dismiss = useCallback((toastId?: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId })
  }, [])
  
  return {
    ...state,
    toast,
    dismiss,
  }
}
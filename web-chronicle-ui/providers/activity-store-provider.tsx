'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'
import {
  type ActivityStore,
  createActivityStore,
  initActivityStore,
} from '@/stores/activity-store'

export type ActivityStoreApi = ReturnType<typeof createActivityStore>

export const ActivityStoreContext = createContext<ActivityStoreApi | undefined>(
  undefined
)

export interface ActivityStoreProviderProps {
  children: ReactNode
}

export const ActivityStoreProvider = ({
  children,
}: ActivityStoreProviderProps) => {
  const storeRef = useRef<ActivityStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createActivityStore(initActivityStore())
  }

  return (
    <ActivityStoreContext.Provider value={storeRef.current}>
      {children}
    </ActivityStoreContext.Provider>
  )
}

export const useActivityStore = <T,>(
  selector: (store: ActivityStore) => T,
): T => {
  const activityStoreContext = useContext(ActivityStoreContext)

  if (!activityStoreContext) {
    throw new Error(`useActivityStore must be used within ActivityStoreProvider`)
  }

  return useStore(activityStoreContext, selector)
}
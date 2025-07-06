import { createStore } from 'zustand/vanilla'
import { Filter } from '@/types'

export type ActivityState = {
  filter: Filter
  selectedActivityId: string | null
  viewMode: 'timeline' | 'grid' | 'compact'
}

export type ActivityActions = {
  setFilter: (filter: Partial<Filter>) => void
  clearFilter: () => void
  setSelectedActivity: (id: string | null) => void
  setViewMode: (mode: ActivityState['viewMode']) => void
}

export type ActivityStore = ActivityState & ActivityActions

export const defaultInitState: ActivityState = {
  filter: {},
  selectedActivityId: null,
  viewMode: 'timeline',
}

export const createActivityStore = (
  initState: ActivityState = defaultInitState,
) => {
  return createStore<ActivityStore>()((set) => ({
    ...initState,
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter },
      })),
    clearFilter: () => set({ filter: {} }),
    setSelectedActivity: (id) => set({ selectedActivityId: id }),
    setViewMode: (mode) => set({ viewMode: mode }),
  }))
}

export const initActivityStore = (): ActivityState => {
  return defaultInitState
}
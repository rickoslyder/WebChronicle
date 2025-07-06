import { createStore } from 'zustand/vanilla'
import { Filter } from '@/types'

export type ActivityState = {
  filter: Filter
  selectedActivityId: string | null
  viewMode: 'timeline' | 'grid' | 'compact'
  selectedActivityIds: Set<string>
  isSelectionMode: boolean
}

export type ActivityActions = {
  setFilter: (filter: Partial<Filter>) => void
  clearFilter: () => void
  setSelectedActivity: (id: string | null) => void
  setViewMode: (mode: ActivityState['viewMode']) => void
  toggleSelectionMode: () => void
  toggleActivitySelection: (id: string) => void
  clearSelection: () => void
  getSelectedCount: () => number
}

export type ActivityStore = ActivityState & ActivityActions

export const defaultInitState: ActivityState = {
  filter: {},
  selectedActivityId: null,
  viewMode: 'timeline',
  selectedActivityIds: new Set(),
  isSelectionMode: false,
}

export const createActivityStore = (
  initState: ActivityState = defaultInitState,
) => {
  return createStore<ActivityStore>()((set, get) => ({
    ...initState,
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter },
      })),
    clearFilter: () => set({ filter: {} }),
    setSelectedActivity: (id) => set({ selectedActivityId: id }),
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleSelectionMode: () =>
      set((state) => ({
        isSelectionMode: !state.isSelectionMode,
        selectedActivityIds: new Set(), // Clear selection when toggling mode
      })),
    toggleActivitySelection: (id) =>
      set((state) => {
        const newSet = new Set(state.selectedActivityIds)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        return { selectedActivityIds: newSet }
      }),
    clearSelection: () => set({ selectedActivityIds: new Set() }),
    getSelectedCount: () => get().selectedActivityIds.size,
  }))
}

export const initActivityStore = (): ActivityState => {
  return defaultInitState
}
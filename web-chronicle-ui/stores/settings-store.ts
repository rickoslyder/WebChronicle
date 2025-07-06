import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Settings } from '@/types'
import { WORKER_URL, AUTH_TOKEN } from '@/lib/constants'

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  workerUrl: WORKER_URL,
  authToken: AUTH_TOKEN,
  autoRefresh: false,
  showSummaries: true,
  defaultView: 'timeline',
  theme: 'system',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) =>
        set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'web-chronicle-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        autoRefresh: state.autoRefresh,
        showSummaries: state.showSummaries,
        defaultView: state.defaultView,
        theme: state.theme,
        // Don't persist API credentials in localStorage
      }),
    }
  )
)
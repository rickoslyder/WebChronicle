import { Suspense } from 'react'
import { Navigation } from './navigation'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { Toaster } from 'sonner'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KeyboardShortcuts />
      <Suspense fallback={null}>
        <Navigation />
      </Suspense>
      {children}
      <Toaster position="bottom-right" />
    </>
  )
}
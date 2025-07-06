import { Navigation } from './navigation'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { Toaster } from 'sonner'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KeyboardShortcuts />
      <Navigation />
      {children}
      <Toaster position="bottom-right" />
    </>
  )
}
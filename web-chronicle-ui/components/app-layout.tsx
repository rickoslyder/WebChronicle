import { Navigation } from './navigation'
import { KeyboardShortcuts } from './keyboard-shortcuts'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KeyboardShortcuts />
      <Navigation />
      {children}
    </>
  )
}
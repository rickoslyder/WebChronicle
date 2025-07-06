import { Metadata } from 'next'
import { SettingsView } from '@/components/settings-view'

export const metadata: Metadata = {
  title: 'Settings | WebChronicle',
  description: 'Configure your WebChronicle preferences',
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SettingsView />
    </div>
  )
}
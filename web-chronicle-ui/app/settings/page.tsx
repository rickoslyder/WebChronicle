import { Suspense } from 'react'
import { Metadata } from 'next'
import { SettingsView } from '@/components/settings-view'
import { AppLayout } from '@/components/app-layout'
import { Loader2 } from 'lucide-react'


export const metadata: Metadata = {
  title: 'Settings | WebChronicle',
  description: 'Configure your WebChronicle preferences',
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <SettingsView />
        </Suspense>
      </div>
    </AppLayout>
  )
}
import { Suspense } from 'react'
import { Metadata } from 'next'
import { InsightsView } from '@/components/insights-view'
import { AppLayout } from '@/components/app-layout'
import { Loader2 } from 'lucide-react'


export const metadata: Metadata = {
  title: 'Insights | WebChronicle',
  description: 'AI-powered insights about your browsing patterns',
}

export default function InsightsPage() {
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
          <InsightsView />
        </Suspense>
      </div>
    </AppLayout>
  )
}
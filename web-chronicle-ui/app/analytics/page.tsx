import { Suspense } from 'react'
import { Metadata } from 'next'
import { AnalyticsDashboardWrapper } from '@/components/analytics-dashboard-wrapper'
import { AppLayout } from '@/components/app-layout'
import { Loader2 } from 'lucide-react'


export const metadata: Metadata = {
  title: 'Analytics | WebChronicle',
  description: 'Insights and trends from your browsing activity',
}

export default function AnalyticsPage() {
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
          <AnalyticsDashboardWrapper />
        </Suspense>
      </div>
    </AppLayout>
  )
}
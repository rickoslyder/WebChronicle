import { Suspense } from 'react'
import { Timeline } from '@/components/timeline'
import { AppLayout } from '@/components/app-layout'
import { TimelineSkeleton } from '@/components/activity-skeleton'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<TimelineSkeleton />}>
          <Timeline />
        </Suspense>
      </main>
    </AppLayout>
  )
}
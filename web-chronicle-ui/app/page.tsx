import { Suspense } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Timeline } from '@/components/timeline'
import { AppLayout } from '@/components/app-layout'
import { TimelineSkeleton } from '@/components/activity-skeleton'
import { api } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'

export default async function HomePage() {
  const queryClient = new QueryClient()

  // Prefetch the first page of activities
  await queryClient.prefetchInfiniteQuery({
    queryKey: QUERY_KEYS.activities,
    queryFn: ({ pageParam }) =>
      api.getActivities({
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    pages: 1,
  })

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<TimelineSkeleton />}>
            <Timeline />
          </Suspense>
        </HydrationBoundary>
      </main>
    </AppLayout>
  )
}
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Timeline } from '@/components/timeline'
import { AppLayout } from '@/components/app-layout'
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

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="border rounded-lg p-4 animate-pulse"
        >
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2 mb-3" />
          <div className="flex gap-4">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
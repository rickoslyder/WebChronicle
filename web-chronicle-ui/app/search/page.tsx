import { Suspense } from 'react'
import { Metadata } from 'next'
import { SearchView } from '@/components/search-view'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Search | WebChronicle',
  description: 'Search your browsing history with semantic understanding',
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SearchView />
      </Suspense>
    </div>
  )
}
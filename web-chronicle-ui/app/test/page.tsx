import { ActivityCard } from '@/components/activity-card'
import { ActivityLogWithTags } from '@/types'

export default function TestPage() {
  const mockActivity: ActivityLogWithTags = {
    id: '1',
    url: 'https://example.com/article',
    title: 'Understanding React Server Components',
    domain: 'example.com',
    visitedAt: new Date().toISOString(),
    contentLength: 5000,
    scrollDepth: 0.75,
    timeOnPage: 180,
    timeSpent: 180,
    createdAt: new Date().toISOString(),
    tags: ['react', 'web-development', 'javascript'],
    tagsJson: JSON.stringify(['react', 'web-development', 'javascript']),
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Activity Card</h1>
      <div className="max-w-2xl">
        <ActivityCard activity={mockActivity} />
      </div>
    </div>
  )
}
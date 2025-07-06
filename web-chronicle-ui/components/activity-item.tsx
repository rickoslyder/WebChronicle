import { ActivityLog } from '@/types'
import { ActivityCard } from './activity-card'
import { parseActivityTags } from '@/lib/utils'

interface ActivityItemProps {
  activity: ActivityLog
  viewMode?: 'timeline' | 'grouped'
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const activityWithTags = parseActivityTags(activity)
  return <ActivityCard activity={activityWithTags} />
}
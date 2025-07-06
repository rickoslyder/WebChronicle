import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function useActivityNotes(activityId: string) {
  const queryClient = useQueryClient()
  
  const { data, isLoading } = useQuery({
    queryKey: ['activity-notes', activityId],
    queryFn: () => api.getActivityNotes(activityId),
    enabled: !!activityId,
  })
  
  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => api.updateActivityNotes(activityId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-notes', activityId] })
      toast.success('Notes saved')
    },
    onError: () => {
      toast.error('Failed to save notes')
    },
  })
  
  return {
    notes: data?.notes || '',
    isLoading,
    updateNotes: updateNotesMutation.mutate,
    isUpdating: updateNotesMutation.isPending,
  }
}
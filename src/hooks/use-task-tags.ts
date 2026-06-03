import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

export function useTaskTags(taskId: string | null) {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  const { data: taskTags = [], isLoading } = useQuery({
    queryKey: ['task-tags', taskId],
    queryFn: async () => {
      if (!taskId) return []
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('task_tags').select('tag_id').eq('task_id', taskId)
      if (error) throw error
      return data.map((row: any) => row.tag_id)
    },
    enabled: !!taskId,
  })

  async function toggleTaskTag(tagId: string) {
    if (!taskId) return

    const hasTag = taskTags.includes(tagId)
    const next = hasTag ? taskTags.filter((id: string) => id !== tagId) : [...taskTags, tagId]
    queryClient.setQueryData(['task-tags', taskId], next)

    try {
      const supabase = await getSupabase()
      if (hasTag) {
        const { error } = await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('task_tags').insert([{ task_id: taskId, tag_id: tagId }])
        if (error) throw error
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update task tags')
      queryClient.invalidateQueries({ queryKey: ['task-tags', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tags', userId] })
    }
  }

  return {
    taskTags,
    isLoading,
    toggleTaskTag,
  }
}

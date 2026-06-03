import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useTagsData } from './use-tags-data'

type TaskTagRow = {
  tag_id: string
}

type TagRecord = {
  id: string
  type: 'normal' | 'exclusive'
  group_name?: string | null
}

export function useTaskTags(taskId: string | null) {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { tags } = useTagsData()
  const taskTagsQueryKey = ['task-tags', taskId, getSupabase] as const
  const taskTagRowsQueryKey = ['task-tag-rows', userId] as const

  const { data: taskTags = [], isLoading } = useQuery({
    queryKey: taskTagsQueryKey,
    queryFn: async () => {
      if (!taskId) return []
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('task_tags').select('tag_id').eq('task_id', taskId)
      if (error) throw error
      return data.map((row: TaskTagRow) => row.tag_id)
    },
    enabled: !!taskId,
  })

  async function toggleTaskTag(tagId: string) {
    if (!taskId) return

    const hasTag = taskTags.includes(tagId)
    const targetTag = (tags as TagRecord[]).find((tag) => tag.id === tagId)
    const exclusiveGroupIds =
      targetTag?.type === 'exclusive' && targetTag.group_name
        ? (tags as TagRecord[])
            .filter((tag) => tag.type === 'exclusive' && tag.group_name === targetTag.group_name)
            .map((tag) => tag.id)
        : []

    const base = hasTag
      ? taskTags.filter((id: string) => id !== tagId)
      : taskTags.filter((id: string) => !exclusiveGroupIds.includes(id))
    const next = hasTag ? base : [...base, tagId]
    queryClient.setQueryData(taskTagsQueryKey, next)

    try {
      const supabase = await getSupabase()
      if (hasTag) {
        const { error } = await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('task_tags').insert([{ task_id: taskId, tag_id: tagId }])
        if (error) throw error
        if (exclusiveGroupIds.length > 0) {
          const staleTagIds = taskTags.filter((id: string) => exclusiveGroupIds.includes(id))
          for (const staleTagId of staleTagIds) {
            const { error: deleteError } = await supabase
              .from('task_tags')
              .delete()
              .eq('task_id', taskId)
              .eq('tag_id', staleTagId)
            if (deleteError) throw deleteError
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: taskTagRowsQueryKey })
    } catch {
      toast.error('Failed to update task tags')
      queryClient.invalidateQueries({ queryKey: taskTagsQueryKey })
      queryClient.invalidateQueries({ queryKey: taskTagRowsQueryKey })
      queryClient.invalidateQueries({ queryKey: ['tags', userId] })
    }
  }

  return {
    taskTags,
    isLoading,
    toggleTaskTag,
  }
}

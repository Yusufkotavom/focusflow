import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { useSupabase } from './use-supabase'
import { useTagsData } from './use-tags-data'

export function useTaskMetadata() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const { tags } = useTagsData()

  const { data: taskTagRows = [] } = useQuery({
    queryKey: ['task-tag-rows', userId],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('task_tags').select('task_id, tag_id')
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const tagMap = tags.reduce<Record<string, any>>((acc, tag: any) => {
    acc[tag.id] = tag
    return acc
  }, {})

  const taskTagsMap = taskTagRows.reduce<Record<string, string[]>>((acc, row: any) => {
    const tag = tagMap[row.tag_id]
    if (!tag) return acc
    acc[row.task_id] ??= []
    acc[row.task_id].push(tag.name)
    return acc
  }, {})

  return {
    taskTagsMap,
  }
}

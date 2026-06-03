import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSupabase } from './use-supabase'
import { isRepeatRule, shiftRecurringDate } from '@/lib/recurrence'

export function useTaskMutations() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  async function completeTask(id: string) {
    const sourceTask = queryClient
      .getQueryData<any[]>(['tasks', userId])
      ?.find((task) => task.id === id)

    queryClient.setQueryData(['tasks', userId], (old: any) =>
      old?.map((task: any) =>
        task.id === id
          ? { ...task, status: 'completed', completed_at: new Date().toISOString() }
          : task
      )
    )

    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      if (sourceTask && isRepeatRule(sourceTask.repeat_rule)) {
        const nextTaskId = crypto.randomUUID()
        const nextTask = {
          id: nextTaskId,
          user_id: sourceTask.user_id,
          title: sourceTask.title,
          note: sourceTask.note ?? null,
          status: sourceTask.project_id ? 'active' : 'inbox',
          project_id: sourceTask.project_id ?? null,
          parent_task_id: sourceTask.parent_task_id ?? null,
          flagged: sourceTask.flagged ?? false,
          defer_date: shiftRecurringDate(sourceTask.defer_date, sourceTask.repeat_rule),
          planned_date: shiftRecurringDate(sourceTask.planned_date, sourceTask.repeat_rule),
          due_date: shiftRecurringDate(sourceTask.due_date, sourceTask.repeat_rule),
          repeat_rule: sourceTask.repeat_rule,
          order: sourceTask.order ?? 0,
          created_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase.from('tasks').insert([nextTask])
        if (insertError) throw insertError

        const { data: currentTags, error: tagsError } = await supabase
          .from('task_tags')
          .select('tag_id')
          .eq('task_id', sourceTask.id)

        if (tagsError) throw tagsError

        if (currentTags.length > 0) {
          const { error: tagInsertError } = await supabase.from('task_tags').insert(
            currentTags.map((row: any) => ({ task_id: nextTaskId, tag_id: row.tag_id }))
          )
          if (tagInsertError) throw tagInsertError
        }
      }
    } catch (err) {
      console.error('Complete task failed:', err)
      toast.error('Failed to complete task')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return {
    completeTask,
  }
}

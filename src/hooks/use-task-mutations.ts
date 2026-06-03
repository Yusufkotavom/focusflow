import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSupabase } from './use-supabase'
import { isRepeatRule, shiftRecurringDate } from '@/lib/recurrence'

type TaskRecord = {
  id: string
  user_id: string
  title: string
  status: string
  note?: string | null
  project_id?: string | null
  parent_task_id?: string | null
  flagged?: boolean
  defer_date?: string | null
  planned_date?: string | null
  due_date?: string | null
  repeat_rule?: string | null
  order?: number | null
  completed_at?: string | null
}

export function useTaskMutations() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  async function completeTask(id: string) {
    const sourceTask = queryClient
      .getQueryData<TaskRecord[]>(['tasks', userId])
      ?.find((task) => task.id === id)

    queryClient.setQueryData(['tasks', userId], (old: TaskRecord[] | undefined) =>
      old?.map((task) =>
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

      if (error) throw error

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
            currentTags.map((row: { tag_id: string }) => ({ task_id: nextTaskId, tag_id: row.tag_id }))
          )
          if (tagInsertError) throw tagInsertError
        }
      }
    } catch (_err) {
      toast.error('Failed to complete task')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  async function reorderTasks(orderedTaskIds: string[]) {
    if (!userId || orderedTaskIds.length === 0) return

    const orderById = new Map(orderedTaskIds.map((id, index) => [id, index]))

    queryClient.setQueryData(['tasks', userId], (old: TaskRecord[] | undefined) =>
      old?.map((task) => {
        const nextOrder = orderById.get(task.id)
        return nextOrder === undefined ? task : { ...task, order: nextOrder }
      })
    )

    try {
      const supabase = await getSupabase()
      const updates = orderedTaskIds.map((id, index) =>
        supabase.from('tasks').update({ order: index }).eq('id', id)
      )
      const results = await Promise.all(updates)
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error
    } catch (_err) {
      toast.error('Failed to reorder tasks')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return {
    completeTask,
    reorderTasks,
  }
}

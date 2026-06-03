import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSupabase } from './use-supabase'

export function useTaskMutations() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  async function completeTask(id: string) {
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

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuth } from '@clerk/react'

type ProjectRecord = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
  user_id: string
  order?: number | null
  created_at?: string | null
}

type TaskRecord = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  project_id?: string | null
  parent_task_id?: string | null
  flagged?: boolean
  defer_date?: string | null
  planned_date?: string | null
  due_date?: string | null
  repeat_rule?: string | null
  order?: number | null
  created_at?: string | null
}

export function useTasksData() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  // 1. Fetch Projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectRecord[]>({
    queryKey: ['projects', userId, getSupabase],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  // 2. Fetch Tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<TaskRecord[]>({
    queryKey: ['tasks', userId, getSupabase],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  // 3. Realtime Subscription
  useEffect(() => {
    if (!userId) return
    let tasksChannel: { unsubscribe: () => void } | undefined
    let projectsChannel: { unsubscribe: () => void } | undefined

    async function setupRealtime() {
      const supabase = await getSupabase()
      
      tasksChannel = supabase
        .channel('tasks-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          // Invalidate cache to refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', userId, getSupabase] })
        })
        .subscribe()
        
      projectsChannel = supabase
        .channel('projects-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          queryClient.invalidateQueries({ queryKey: ['projects', userId, getSupabase] })
        })
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (tasksChannel) tasksChannel.unsubscribe()
      if (projectsChannel) projectsChannel.unsubscribe()
    }
  }, [userId, getSupabase, queryClient])

  return {
    tasks,
    projects,
    isLoading: isLoadingTasks || isLoadingProjects,
  }
}

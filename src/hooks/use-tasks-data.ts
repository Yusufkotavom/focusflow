import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './use-supabase'
import { useAuth } from '@clerk/react'

export function useTasksData() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  // 1. Fetch Projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  // 2. Fetch Tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  // 3. Realtime Subscription
  useEffect(() => {
    if (!userId) return
    let tasksChannel: any
    let projectsChannel: any

    async function setupRealtime() {
      const supabase = await getSupabase()
      
      tasksChannel = supabase
        .channel('tasks-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          // Invalidate cache to refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
        })
        .subscribe()
        
      projectsChannel = supabase
        .channel('projects-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          queryClient.invalidateQueries({ queryKey: ['projects', userId] })
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

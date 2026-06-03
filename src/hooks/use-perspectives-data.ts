import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useSupabase } from './use-supabase'

export function usePerspectivesData() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  const { data: perspectives = [], isLoading } = useQuery({
    queryKey: ['perspectives', userId],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('perspectives').select('*').order('order', { ascending: true }).order('name')
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  async function createPerspective(input: Record<string, unknown>) {
    if (!userId) return
    const tempId = crypto.randomUUID()
    const tempPerspective = { id: tempId, user_id: userId, ...input }
    queryClient.setQueryData(['perspectives', userId], (old: any) => [...(old || []), tempPerspective])

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('perspectives').insert([tempPerspective])
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to create perspective')
      queryClient.invalidateQueries({ queryKey: ['perspectives', userId] })
    }
  }

  async function updatePerspective(id: string, updates: Record<string, unknown>) {
    queryClient.setQueryData(['perspectives', userId], (old: any) =>
      old?.map((perspective: any) => (perspective.id === id ? { ...perspective, ...updates } : perspective))
    )
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('perspectives').update(updates).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to update perspective')
      queryClient.invalidateQueries({ queryKey: ['perspectives', userId] })
    }
  }

  return {
    perspectives,
    isLoading,
    createPerspective,
    updatePerspective,
  }
}

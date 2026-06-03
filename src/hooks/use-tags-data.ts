import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { useSupabase } from './use-supabase'

export function useTagsData() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('tags').select('*').order('order', { ascending: true }).order('name')
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  return {
    tags,
    isLoading,
  }
}

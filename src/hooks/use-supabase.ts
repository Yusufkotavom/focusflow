import { useAuth } from '@clerk/react'
import { useMemo } from 'react'
import { createClerkSupabaseClient } from '@/lib/supabase'

export function useSupabase() {
  const { getToken } = useAuth()

  return useMemo(() => {
    return async () => {
      // Kita meminta token khusus yang didefinisikan sebagai "supabase" di Clerk Dashboard (JWT Template)
      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Missing Clerk Token')
      return createClerkSupabaseClient(token)
    }
  }, [getToken])
}

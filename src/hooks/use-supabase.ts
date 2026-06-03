import { useAuth } from '@clerk/react'
import { useMemo } from 'react'
import { createClerkSupabaseClient } from '@/lib/supabase'

export function useSupabase() {
  const { getToken } = useAuth()

  return useMemo(() => {
    return async () => {
      // Kita pakai token default Clerk (tanpa template), jadi tidak perlu pusing setting Dashboard.
      // Database RLS akan mendekode header Bearer manual dari request ini.
      const token = await getToken()
      if (!token) throw new Error('Missing Clerk Token')
      return createClerkSupabaseClient(token)
    }
  }, [getToken])
}

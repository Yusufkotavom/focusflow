import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import type { PostgrestError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useSupabase } from './use-supabase'

type PerspectiveRow = {
  id: string
  user_id: string
  name: string
  icon?: string | null
  rules: Record<string, unknown>
  group_by?: string | null
  sort_by?: string | null
  show_completed?: boolean | null
  show_dropped?: boolean | null
  order?: number | null
}

type PerspectivePayload = {
  id: string
  user_id: string
  name: string
  icon?: string | null
  rules: Record<string, unknown>
  group_by?: string | null
  sort_by?: string | null
  show_completed?: boolean | null
  show_dropped?: boolean | null
  order?: number | null
}

function sanitizePerspectiveInput(input: Record<string, unknown>, base: { id: string; user_id: string }): PerspectivePayload {
  return {
    id: base.id,
    user_id: base.user_id,
    name: String(input.name ?? ''),
    icon: (input.icon as string | null | undefined) ?? null,
    rules: (input.rules as Record<string, unknown> | undefined) ?? {},
    group_by: (input.group_by as string | null | undefined) ?? null,
    sort_by: (input.sort_by as string | null | undefined) ?? null,
    show_completed: (input.show_completed as boolean | null | undefined) ?? false,
    show_dropped: (input.show_dropped as boolean | null | undefined) ?? false,
    order: (input.order as number | null | undefined) ?? 0,
  }
}

function sanitizePerspectiveUpdates(updates: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {}
  if ('name' in updates) sanitized.name = updates.name
  if ('icon' in updates) sanitized.icon = updates.icon ?? null
  if ('rules' in updates) sanitized.rules = updates.rules ?? {}
  if ('group_by' in updates) sanitized.group_by = updates.group_by ?? null
  if ('sort_by' in updates) sanitized.sort_by = updates.sort_by ?? null
  if ('show_completed' in updates) sanitized.show_completed = updates.show_completed ?? false
  if ('show_dropped' in updates) sanitized.show_dropped = updates.show_dropped ?? false
  if ('order' in updates) sanitized.order = updates.order ?? 0
  return sanitized
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const postgrestError = error as PostgrestError
    if (postgrestError.message) return postgrestError.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function usePerspectivesData() {
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const perspectivesQueryKey = ['perspectives', userId, getSupabase] as const

  const { data: perspectives = [], isLoading } = useQuery({
    queryKey: perspectivesQueryKey,
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('perspectives').select('*').order('order', { ascending: true }).order('name')
      if (error) throw error
      return (data ?? []) as PerspectiveRow[]
    },
    enabled: !!userId,
  })

  async function createPerspective(input: Record<string, unknown>) {
    if (!userId) return
    const tempId = crypto.randomUUID()
    const tempPerspective = sanitizePerspectiveInput(input, { id: tempId, user_id: userId })
    queryClient.setQueryData(perspectivesQueryKey, (old: PerspectiveRow[] | undefined) => [...(old ?? []), tempPerspective])

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('perspectives').insert([tempPerspective])
      if (error) throw error
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create perspective'))
      queryClient.invalidateQueries({ queryKey: perspectivesQueryKey })
    }
  }

  async function updatePerspective(id: string, updates: Record<string, unknown>) {
    const sanitizedUpdates = sanitizePerspectiveUpdates(updates)
    queryClient.setQueryData(perspectivesQueryKey, (old: PerspectiveRow[] | undefined) =>
      old?.map((perspective) => (perspective.id === id ? { ...perspective, ...sanitizedUpdates } : perspective))
    )
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('perspectives').update(sanitizedUpdates).eq('id', id)
      if (error) throw error
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update perspective'))
      queryClient.invalidateQueries({ queryKey: perspectivesQueryKey })
    }
  }

  async function deletePerspective(id: string) {
    queryClient.setQueryData(perspectivesQueryKey, (old: PerspectiveRow[] | undefined) =>
      old?.filter((perspective) => perspective.id !== id)
    )
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('perspectives').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete perspective'))
      queryClient.invalidateQueries({ queryKey: perspectivesQueryKey })
    }
  }

  return {
    perspectives,
    isLoading,
    createPerspective,
    updatePerspective,
    deletePerspective,
  }
}

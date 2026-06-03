import { useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTagsData } from '@/hooks/use-tags-data'
import { useSupabase } from '@/hooks/use-supabase'

type TagRecord = {
  id: string
  name: string
  user_id: string
  type: 'normal' | 'exclusive'
  group_name?: string | null
  color?: string | null
  order?: number | null
}

export function TagsView() {
  const [name, setName] = useState('')
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const { tags, isLoading } = useTagsData()
  const { userId } = useAuth()
  const getSupabase = useSupabase()
  const queryClient = useQueryClient()
  const tagsQueryKey = ['tags', userId] as const

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !userId) return

    const tempId = crypto.randomUUID()
    const tempTag: TagRecord = {
      id: tempId,
      name: name.trim(),
      type: 'normal',
      group_name: null,
      user_id: userId,
      color: null,
      order: tags.length,
    }

    queryClient.setQueryData(tagsQueryKey, (old: TagRecord[] | undefined) => [...(old ?? []), tempTag])
    setName('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tags').insert([tempTag])
      if (error) throw error
      toast.success('Tag created')
    } catch {
      toast.error('Failed to create tag')
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    }
  }

  function startEditing(tag: TagRecord) {
    setEditingTagId(tag.id)
    setEditingName(tag.name)
  }

  function cancelEditing() {
    setEditingTagId(null)
    setEditingName('')
  }

  async function saveEditing(tagId: string) {
    const nextName = editingName.trim()
    if (!nextName) return

    queryClient.setQueryData(tagsQueryKey, (old: TagRecord[] | undefined) =>
      old?.map((tag) => (tag.id === tagId ? { ...tag, name: nextName } : tag))
    )
    cancelEditing()

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tags').update({ name: nextName }).eq('id', tagId)
      if (error) throw error
      toast.success('Tag updated')
    } catch {
      toast.error('Failed to update tag')
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    }
  }

  async function deleteTag(tagId: string) {
    queryClient.setQueryData(tagsQueryKey, (old: TagRecord[] | undefined) =>
      old?.filter((tag) => tag.id !== tagId)
    )

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tags').delete().eq('id', tagId)
      if (error) throw error
      toast.success('Tag deleted')
    } catch {
      toast.error('Failed to delete tag')
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Tags</h1>
          <p className='text-xs text-muted-foreground'>Simple tag list</p>
        </div>
        <ThemeSwitch />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreateTag} className='flex items-center gap-2 border-b bg-muted/30 px-4 py-3'>
          <Plus className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='New tag...'
            className='border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
          />
          <Button type='submit' variant='outline' size='sm' disabled={!name.trim()}>
            Add
          </Button>
        </form>

        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <p className='mt-10 text-center text-sm text-muted-foreground'>Loading tags...</p>
          ) : tags.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <Tags className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>No tags yet</p>
              <p className='mt-1 text-xs text-muted-foreground'>Add a tag above to start organizing tasks.</p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-none border-0'>
              {(tags as TagRecord[]).map((tag) => (
                <div key={tag.id} className='border-b border-border/50 px-4 py-3 last:border-b-0'>
                  <div className='flex items-center gap-3'>
                    {editingTagId === tag.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              void saveEditing(tag.id)
                            }
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          className='h-8 flex-1'
                          autoFocus
                        />
                        <Button size='sm' onClick={() => void saveEditing(tag.id)} disabled={!editingName.trim()}>
                          Save
                        </Button>
                        <Button size='sm' variant='ghost' onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className='min-w-0 flex-1 truncate text-sm font-medium'>{tag.name}</span>
                        <Button size='icon' variant='ghost' className='h-8 w-8' onClick={() => startEditing(tag)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 text-destructive'
                          onClick={() => void deleteTag(tag.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

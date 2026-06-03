import { useState } from 'react'
import { Tags, Plus } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTagsData } from '@/hooks/use-tags-data'
import { useSupabase } from '@/hooks/use-supabase'
import { toast } from 'sonner'

export function TagsView() {
  const [name, setName] = useState('')
  const [type, setType] = useState<'normal' | 'exclusive'>('normal')
  const [groupName, setGroupName] = useState('')
  const { tags, isLoading } = useTagsData()
  const { userId } = useAuth()
  const getSupabase = useSupabase()
  const queryClient = useQueryClient()

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !userId) return

    const tempId = crypto.randomUUID()
    const tempTag = {
      id: tempId,
      name: name.trim(),
      type,
      group_name: type === 'exclusive' ? groupName.trim() || null : null,
      user_id: userId,
      color: null,
      order: tags.length,
    }

    queryClient.setQueryData(['tags', userId], (old: any) => [tempTag, ...(old || [])])
    setName('')
    setGroupName('')
    setType('normal')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tags').insert([tempTag])
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to create tag')
      queryClient.invalidateQueries({ queryKey: ['tags', userId] })
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Tags</h1>
          <p className='text-xs text-muted-foreground'>Context-based organization</p>
        </div>
        <ThemeSwitch />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreateTag} className='grid gap-3 border-b bg-muted/30 px-4 py-3 md:grid-cols-[1fr_160px_180px_auto]'>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='New Tag...'
            className='bg-background'
          />
          <Select value={type} onValueChange={(value: 'normal' | 'exclusive') => setType(value)}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='normal'>Normal</SelectItem>
              <SelectItem value='exclusive'>Exclusive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder='Group name (optional)'
            className='bg-background'
            disabled={type !== 'exclusive'}
          />
          <button className='inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-accent'>
            <Plus className='h-4 w-4' />
            Add Tag
          </button>
        </form>

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground text-center mt-10'>Loading tags...</p>
          ) : tags.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <Tags className='h-12 w-12 text-muted-foreground/30 mb-3' />
              <p className='text-sm font-medium text-muted-foreground'>No tags created</p>
              <p className='text-xs text-muted-foreground mt-1'>Tags help you filter by context (e.g. coding, phone, low-energy).</p>
            </div>
          ) : (
            <div className='flex flex-wrap gap-3'>
              {tags.map((tag: any) => (
                <div key={tag.id} className='rounded-lg border bg-card p-3'>
                  <div className='flex items-center gap-2'>
                    <Badge variant={tag.type === 'exclusive' ? 'default' : 'outline'}>{tag.name}</Badge>
                    <span className='text-xs text-muted-foreground capitalize'>{tag.type}</span>
                  </div>
                  {tag.group_name ? <p className='mt-2 text-xs text-muted-foreground'>Group: {tag.group_name}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

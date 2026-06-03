import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'
import type { PerspectiveGroupBy, PerspectiveSortBy } from '@/lib/perspective-engine'

export function PerspectivesManage() {
  const { perspectives, isLoading, createPerspective } = usePerspectivesData()
  const [name, setName] = useState('')
  const [groupBy, setGroupBy] = useState<PerspectiveGroupBy>('project')
  const [sortBy, setSortBy] = useState<PerspectiveSortBy>('manual')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    await createPerspective({
      name: name.trim(),
      rules: {},
      group_by: groupBy,
      sort_by: sortBy,
      show_completed: false,
      show_dropped: false,
      order: perspectives.length,
    })
    setName('')
    setGroupBy('project')
    setSortBy('manual')
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Perspectives</h1>
          <p className='text-xs text-muted-foreground'>Define your own filtered and grouped task views</p>
        </div>
        <ThemeSwitch />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreate} className='grid gap-3 border-b bg-muted/30 px-4 py-3 md:grid-cols-[1fr_160px_160px_auto]'>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='New perspective name...' className='bg-background' />
          <Select value={groupBy} onValueChange={(value: PerspectiveGroupBy) => setGroupBy(value)}>
            <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>No grouping</SelectItem>
              <SelectItem value='project'>By project</SelectItem>
              <SelectItem value='status'>By status</SelectItem>
              <SelectItem value='tag'>By tag</SelectItem>
              <SelectItem value='due'>By due date</SelectItem>
              <SelectItem value='planned'>By planned date</SelectItem>
              <SelectItem value='defer'>By defer date</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: PerspectiveSortBy) => setSortBy(value)}>
            <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='manual'>Manual</SelectItem>
              <SelectItem value='title'>Title</SelectItem>
              <SelectItem value='created'>Created</SelectItem>
              <SelectItem value='due'>Due</SelectItem>
              <SelectItem value='planned'>Planned</SelectItem>
              <SelectItem value='defer'>Defer</SelectItem>
            </SelectContent>
          </Select>
          <Button type='submit'><Plus className='mr-2 h-4 w-4' />Create</Button>
        </form>

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <p className='mt-10 text-center text-sm text-muted-foreground'>Loading perspectives...</p>
          ) : perspectives.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <SlidersHorizontal className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>No custom perspectives yet</p>
              <p className='mt-1 text-xs text-muted-foreground'>Create a perspective, then refine its filters in the database-backed settings later.</p>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {perspectives.map((perspective: any) => (
                <Link
                  key={perspective.id}
                  to='/perspectives/$perspectiveId'
                  params={{ perspectiveId: perspective.id }}
                  className='rounded-lg border bg-card p-4 transition-colors hover:border-primary/50'
                >
                  <div className='flex items-center gap-2'>
                    <h3 className='text-sm font-semibold'>{perspective.name}</h3>
                    <Badge variant='outline'>{perspective.group_by ?? 'none'}</Badge>
                    <Badge variant='secondary'>{perspective.sort_by ?? 'manual'}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

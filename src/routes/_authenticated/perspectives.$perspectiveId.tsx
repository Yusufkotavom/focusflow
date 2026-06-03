import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { CustomPerspectiveView } from '@/features/perspectives'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useTagsData } from '@/hooks/use-tags-data'
import type { PerspectiveGroupBy, PerspectiveSortBy } from '@/lib/perspective-engine'

export const Route = createFileRoute('/_authenticated/perspectives/$perspectiveId')({
  component: PerspectiveRoute,
})

function PerspectiveRoute() {
  const { perspectiveId } = Route.useParams()
  const { perspectives, isLoading, updatePerspective } = usePerspectivesData()
  const { projects } = useTasksData()
  const { tags } = useTagsData()

  if (isLoading) return null

  const perspective = perspectives.find((item: any) => item.id === perspectiveId)
  if (!perspective) throw notFound()

  const rules = useMemo(() => ({ ...(perspective.rules ?? {}) }), [perspective.rules])

  function toggleStatus(status: string, checked: boolean) {
    const current = new Set<string>(rules.statuses ?? [])
    if (checked) current.add(status)
    else current.delete(status)
    updatePerspective(perspective.id, { rules: { ...rules, statuses: Array.from(current) } })
  }

  function toggleProject(projectId: string, checked: boolean) {
    const current = new Set<string>(rules.projectIds ?? [])
    if (checked) current.add(projectId)
    else current.delete(projectId)
    updatePerspective(perspective.id, { rules: { ...rules, projectIds: Array.from(current) } })
  }

  function toggleTag(tagId: string, checked: boolean) {
    const current = new Set<string>(rules.tagIds ?? [])
    if (checked) current.add(tagId)
    else current.delete(tagId)
    updatePerspective(perspective.id, { rules: { ...rules, tagIds: Array.from(current) } })
  }

  function toggleDateField(dateField: 'due' | 'planned' | 'defer', checked: boolean) {
    const current = new Set<string>(rules.dateFields ?? [])
    if (checked) current.add(dateField)
    else current.delete(dateField)
    updatePerspective(perspective.id, { rules: { ...rules, dateFields: Array.from(current) } })
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Edit Perspective</h1>
          <p className='text-xs text-muted-foreground'>Control filters, grouping, and sorting for this custom view</p>
        </div>
        <ThemeSwitch />
      </Header>

      <Main className='grid gap-4 p-4 lg:grid-cols-[360px_minmax(0,1fr)]'>
        <div className='space-y-4 rounded-lg border bg-card p-4'>
          <div className='space-y-2'>
            <label className='text-xs font-medium text-muted-foreground'>Name</label>
            <Input value={perspective.name} onChange={(e) => updatePerspective(perspective.id, { name: e.target.value })} />
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-medium text-muted-foreground'>Description</label>
            <Input
              value={perspective.description ?? ''}
              onChange={(e) => updatePerspective(perspective.id, { description: e.target.value })}
              placeholder='Describe this perspective'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-medium text-muted-foreground'>Grouping</label>
            <Select value={perspective.group_by ?? 'none'} onValueChange={(value: PerspectiveGroupBy) => updatePerspective(perspective.id, { group_by: value })}>
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
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-medium text-muted-foreground'>Sorting</label>
            <Select value={perspective.sort_by ?? 'manual'} onValueChange={(value: PerspectiveSortBy) => updatePerspective(perspective.id, { sort_by: value })}>
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
          </div>

          <div className='space-y-3'>
            <label className='text-xs font-medium text-muted-foreground'>Rules</label>
            <div className='space-y-2'>
              <label className='text-xs font-medium text-muted-foreground'>Combine rules</label>
              <Select value={rules.mode ?? 'and'} onValueChange={(value: 'and' | 'or') => updatePerspective(perspective.id, { rules: { ...rules, mode: value } })}>
                <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='and'>AND</SelectItem>
                  <SelectItem value='or'>OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!rules.flagged} onCheckedChange={(v) => updatePerspective(perspective.id, { rules: { ...rules, flagged: !!v } })} />Flagged only</label>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!rules.noProject} onCheckedChange={(v) => updatePerspective(perspective.id, { rules: { ...rules, noProject: !!v } })} />No project only</label>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!rules.deferred} onCheckedChange={(v) => updatePerspective(perspective.id, { rules: { ...rules, deferred: !!v } })} />Deferred only</label>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!rules.available} onCheckedChange={(v) => updatePerspective(perspective.id, { rules: { ...rules, available: !!v } })} />Available only</label>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!rules.hasRepeat} onCheckedChange={(v) => updatePerspective(perspective.id, { rules: { ...rules, hasRepeat: !!v } })} />Recurring only</label>
          </div>

          <div className='space-y-3'>
            <label className='text-xs font-medium text-muted-foreground'>Statuses</label>
            {(['inbox', 'active', 'completed', 'dropped'] as const).map((status) => (
              <label key={status} className='flex items-center gap-2 text-sm capitalize'>
                <Checkbox
                  checked={(rules.statuses ?? []).includes(status)}
                  onCheckedChange={(checked) => toggleStatus(status, !!checked)}
                />
                {status}
              </label>
            ))}
          </div>

          <div className='space-y-3'>
            <label className='text-xs font-medium text-muted-foreground'>Projects</label>
            <div className='max-h-40 space-y-2 overflow-y-auto rounded-md border p-2'>
              {projects.map((project: any) => (
                <label key={project.id} className='flex items-center gap-2 text-sm'>
                  <Checkbox checked={(rules.projectIds ?? []).includes(project.id)} onCheckedChange={(checked) => toggleProject(project.id, !!checked)} />
                  <span className='truncate'>{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <label className='text-xs font-medium text-muted-foreground'>Tags</label>
            <div className='max-h-40 space-y-2 overflow-y-auto rounded-md border p-2'>
              {tags.map((tag: any) => (
                <label key={tag.id} className='flex items-center gap-2 text-sm'>
                  <Checkbox checked={(rules.tagIds ?? []).includes(tag.id)} onCheckedChange={(checked) => toggleTag(tag.id, !!checked)} />
                  <span className='truncate'>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <label className='text-xs font-medium text-muted-foreground'>Date fields</label>
            {(['due', 'planned', 'defer'] as const).map((dateField) => (
              <label key={dateField} className='flex items-center gap-2 text-sm capitalize'>
                <Checkbox checked={(rules.dateFields ?? []).includes(dateField)} onCheckedChange={(checked) => toggleDateField(dateField, !!checked)} />
                Has {dateField} date
              </label>
            ))}
          </div>

          <div className='space-y-3'>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!perspective.show_completed} onCheckedChange={(v) => updatePerspective(perspective.id, { show_completed: !!v })} />Show completed</label>
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={!!perspective.show_dropped} onCheckedChange={(v) => updatePerspective(perspective.id, { show_dropped: !!v })} />Show dropped</label>
          </div>
        </div>

        <CustomPerspectiveView
          perspective={{
            id: perspective.id,
            name: perspective.name,
            description: perspective.description ?? `Custom perspective · group by ${perspective.group_by ?? 'none'}`,
            rules: perspective.rules ?? {},
            groupBy: perspective.group_by ?? 'none',
            sortBy: perspective.sort_by ?? 'manual',
            showCompleted: perspective.show_completed ?? false,
            showDropped: perspective.show_dropped ?? false,
          }}
        />
      </Main>
    </>
  )
}

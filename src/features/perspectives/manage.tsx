import { useMemo, useState } from 'react'
import { FolderSearch, PencilLine, Plus, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useTagsData } from '@/hooks/use-tags-data'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import {
  filterTasksForPerspective,
  type PerspectiveDefinition,
  type PerspectiveGroupBy,
  type PerspectiveRules,
  type PerspectiveSortBy,
} from '@/lib/perspective-engine'

const ANY_VALUE = '__any__'
const STATUS_OPTIONS = ['inbox', 'active', 'completed', 'dropped'] as const
const DATE_FIELD_OPTIONS = ['due', 'planned', 'defer'] as const

type ManagePerspective = {
  id: string
  name: string
  description?: string | null
  rules?: PerspectiveRules | null
  group_by?: PerspectiveGroupBy | null
  sort_by?: PerspectiveSortBy | null
  show_completed?: boolean | null
  show_dropped?: boolean | null
}

type ManageTag = {
  id: string
  name: string
}

type ManageProject = {
  id: string
  name: string
}

function sanitizeManagedRules(rules: PerspectiveRules) {
  return {
    mode: rules.mode ?? 'and',
    flagged: !!rules.flagged,
    noProject: !!rules.noProject,
    deferred: !!rules.deferred,
    available: !!rules.available,
    hasRepeat: !!rules.hasRepeat,
    statuses: rules.statuses?.length ? [rules.statuses[0]] : undefined,
    projectIds: rules.projectIds?.length ? [rules.projectIds[0]] : undefined,
    tagIds: rules.tagIds?.length ? [rules.tagIds[0]] : undefined,
    dateFields: rules.dateFields?.length ? rules.dateFields : undefined,
  } satisfies PerspectiveRules
}

function ruleSummaryBadges(rules: PerspectiveRules) {
  const badges: string[] = []
  if (rules.flagged) badges.push('Flagged')
  if (rules.available) badges.push('Available')
  if (rules.noProject) badges.push('No Project')
  if (rules.deferred) badges.push('Deferred')
  if (rules.hasRepeat) badges.push('Recurring')
  if (rules.statuses?.length) badges.push(`Status: ${rules.statuses.join(', ')}`)
  if (rules.projectIds?.length) badges.push('Project')
  if (rules.tagIds?.length) badges.push('Tag')
  if (rules.dateFields?.length) badges.push(`Has: ${rules.dateFields.join(', ')}`)
  return badges
}

export function PerspectivesManage() {
  const { perspectives, isLoading, createPerspective, updatePerspective } = usePerspectivesData()
  const { tasks, projects } = useTasksData()
  const { tags } = useTagsData()
  const { taskTagIdsMap } = useTaskMetadata()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupBy, setGroupBy] = useState<PerspectiveGroupBy>('project')
  const [sortBy, setSortBy] = useState<PerspectiveSortBy>('manual')
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string | null>(null)

  const selectedPerspective = useMemo(
    () => (perspectives as ManagePerspective[]).find((item) => item.id === selectedPerspectiveId) ?? null,
    [perspectives, selectedPerspectiveId]
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    await createPerspective({
      name: name.trim(),
      description: description.trim() || null,
      rules: {},
      group_by: groupBy,
      sort_by: sortBy,
      show_completed: false,
      show_dropped: false,
      order: perspectives.length,
    })
    setName('')
    setDescription('')
    setGroupBy('project')
    setSortBy('manual')
  }

  function updateQueryRule(
    perspective: ManagePerspective,
    key: 'tagIds' | 'projectIds' | 'statuses',
    value: string
  ) {
    const rules = sanitizeManagedRules(perspective.rules ?? {})

    if (value === ANY_VALUE) {
      delete rules[key]
    } else if (key === 'statuses') {
      rules.statuses = [value]
    } else if (key === 'projectIds') {
      rules.projectIds = [value]
    } else {
      rules.tagIds = [value]
    }

    updatePerspective(perspective.id, { rules })
  }

  function toggleBooleanRule(perspective: ManagePerspective, key: keyof Pick<PerspectiveRules, 'flagged' | 'available' | 'noProject' | 'deferred' | 'hasRepeat'>, checked: boolean) {
    const rules = sanitizeManagedRules(perspective.rules ?? {})
    rules[key] = checked
    updatePerspective(perspective.id, { rules })
  }

  function toggleDateField(
    perspective: ManagePerspective,
    dateField: (typeof DATE_FIELD_OPTIONS)[number],
    checked: boolean
  ) {
    const rules = sanitizeManagedRules(perspective.rules ?? {})
    const current = new Set(rules.dateFields ?? [])
    if (checked) current.add(dateField)
    else current.delete(dateField)
    rules.dateFields = current.size ? Array.from(current) as PerspectiveRules['dateFields'] : undefined
    updatePerspective(perspective.id, { rules })
  }

  function buildPerspectiveDefinition(perspective: ManagePerspective): PerspectiveDefinition {
    return {
      id: perspective.id,
      name: perspective.name,
      description: perspective.description ?? '',
      rules: perspective.rules ?? {},
      groupBy: perspective.group_by ?? 'none',
      sortBy: perspective.sort_by ?? 'manual',
      showCompleted: perspective.show_completed ?? false,
      showDropped: perspective.show_dropped ?? false,
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Perspectives</h1>
          <p className='text-xs text-muted-foreground'>Define custom filtered and grouped task views</p>
        </div>
        <ThemeSwitch />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreate} className='space-y-3 border-b bg-muted/30 px-4 py-3'>
          <div className='flex gap-3'>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='New perspective name...' className='bg-background flex-1' />
            <Button type='submit' disabled={!name.trim()}><Plus className='mr-2 h-4 w-4' />Create</Button>
          </div>
          <div className='flex gap-3'>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Description (optional)' className='bg-background flex-1' />
            <Select value={groupBy} onValueChange={(value: PerspectiveGroupBy) => setGroupBy(value)}>
              <SelectTrigger className='w-40'><SelectValue /></SelectTrigger>
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
              <SelectTrigger className='w-40'><SelectValue /></SelectTrigger>
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
        </form>

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <p className='mt-10 text-center text-sm text-muted-foreground'>Loading perspectives...</p>
          ) : perspectives.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <SlidersHorizontal className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>No custom perspectives yet</p>
              <p className='mt-1 text-xs text-muted-foreground'>Create a perspective above, then click it to configure filters and rules.</p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border bg-card'>
              {(perspectives as ManagePerspective[]).map((perspective) => {
                const rules: PerspectiveRules = perspective.rules ?? {}
                const badges = ruleSummaryBadges(rules)
                const mode = rules.mode ?? 'and'
                const definition = buildPerspectiveDefinition(perspective)
                const matchedTasks = filterTasksForPerspective({
                  tasks,
                  projects,
                  taskTagIdsMap,
                  definition,
                })
                const nextAction = matchedTasks[0]?.title

                return (
                  <div key={perspective.id} className='group border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/50'>
                    <div className='flex items-center gap-3 px-4 py-3'>
                      <button
                        type='button'
                        onClick={() => setSelectedPerspectiveId(perspective.id)}
                        className='flex min-w-0 flex-1 items-center gap-3 text-left'
                      >
                        <FolderSearch className='h-4 w-4 flex-shrink-0 text-emerald-500' />
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='truncate text-sm font-medium'>{perspective.name}</span>
                            <Badge variant='outline' className='h-5 text-[10px] capitalize'>
                              {perspective.group_by ?? 'none'}
                            </Badge>
                            <Badge variant='secondary' className='h-5 text-[10px] capitalize'>
                              {perspective.sort_by ?? 'manual'}
                            </Badge>
                            <Badge variant='outline' className='h-5 text-[10px] uppercase'>
                              {mode}
                            </Badge>
                            {badges.map((badge) => (
                              <Badge key={badge} variant='outline' className='h-5 text-[10px]'>
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          {perspective.description ? (
                            <p className='mt-0.5 truncate text-xs text-muted-foreground'>{perspective.description}</p>
                          ) : nextAction ? (
                            <p className='mt-0.5 truncate text-xs text-muted-foreground'>Next: {nextAction}</p>
                          ) : (
                            <p className='mt-0.5 text-xs text-muted-foreground/60'>No matching tasks</p>
                          )}
                        </div>
                      </button>

                      <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-8 px-2 text-xs'
                          onClick={() => setSelectedPerspectiveId(perspective.id)}
                        >
                          <PencilLine className='mr-1 h-3.5 w-3.5' />
                          Manage
                        </Button>
                      </div>
                    </div>

                    <div className='px-4 pb-3 text-xs text-muted-foreground'>
                      {matchedTasks.length} matching task{matchedTasks.length === 1 ? '' : 's'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Main>

      <Dialog open={!!selectedPerspective} onOpenChange={(open) => setSelectedPerspectiveId(open ? selectedPerspectiveId : null)}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          {selectedPerspective ? (
            <>
              <DialogHeader>
                <DialogTitle>Manage Perspective</DialogTitle>
                <DialogDescription>
                  Ubah nama, grouping, sorting, dan query filter untuk perspective ini.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-xs font-medium text-muted-foreground'>Name</label>
                  <Input
                    value={selectedPerspective.name}
                    onChange={(e) => updatePerspective(selectedPerspective.id, { name: e.target.value })}
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-xs font-medium text-muted-foreground'>Description</label>
                  <Input
                    value={selectedPerspective.description ?? ''}
                    onChange={(e) => updatePerspective(selectedPerspective.id, { description: e.target.value })}
                    placeholder='Describe this perspective'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-xs font-medium text-muted-foreground'>Grouping</label>
                  <Select
                    value={selectedPerspective.group_by ?? 'none'}
                    onValueChange={(value: PerspectiveGroupBy) =>
                      updatePerspective(selectedPerspective.id, { group_by: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={selectedPerspective.sort_by ?? 'manual'}
                    onValueChange={(value: PerspectiveSortBy) =>
                      updatePerspective(selectedPerspective.id, { sort_by: value })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
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
              </div>

              <div className='space-y-3 rounded-lg border p-4'>
                <div>
                  <h3 className='text-sm font-medium'>Query</h3>
                  <p className='text-xs text-muted-foreground'>
                    Pilih satu filter atau kosongkan. Bisa gabung `tag`, `project`, dan `status`.
                  </p>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
                  <label className='text-xs font-medium text-muted-foreground'>Combine</label>
                  <Select
                    value={(sanitizeManagedRules(selectedPerspective.rules ?? {}).mode ?? 'and') as 'and' | 'or'}
                    onValueChange={(value: 'and' | 'or') =>
                      updatePerspective(selectedPerspective.id, {
                        rules: { ...sanitizeManagedRules(selectedPerspective.rules ?? {}), mode: value },
                      })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='and'>AND</SelectItem>
                      <SelectItem value='or'>OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
                  <label className='text-xs font-medium text-muted-foreground'>Tag</label>
                  <Select
                    value={sanitizeManagedRules(selectedPerspective.rules ?? {}).tagIds?.[0] ?? ANY_VALUE}
                    onValueChange={(value) => updateQueryRule(selectedPerspective, 'tagIds', value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_VALUE}>Any tag</SelectItem>
                      {(tags as ManageTag[]).map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
                  <label className='text-xs font-medium text-muted-foreground'>Project</label>
                  <Select
                    value={sanitizeManagedRules(selectedPerspective.rules ?? {}).projectIds?.[0] ?? ANY_VALUE}
                    onValueChange={(value) => updateQueryRule(selectedPerspective, 'projectIds', value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_VALUE}>Any project</SelectItem>
                      {(projects as ManageProject[]).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
                  <label className='text-xs font-medium text-muted-foreground'>Status</label>
                  <Select
                    value={sanitizeManagedRules(selectedPerspective.rules ?? {}).statuses?.[0] ?? ANY_VALUE}
                    onValueChange={(value) => updateQueryRule(selectedPerspective, 'statuses', value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_VALUE}>Any status</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]'>
                  <label className='text-xs font-medium text-muted-foreground md:pt-2'>Flags</label>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    {([
                      ['flagged', 'Flagged'],
                      ['available', 'Available'],
                      ['noProject', 'No Project'],
                      ['deferred', 'Deferred'],
                      ['hasRepeat', 'Recurring'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className='flex items-center gap-2 text-sm'>
                        <Checkbox
                          checked={!!sanitizeManagedRules(selectedPerspective.rules ?? {})[key]}
                          onCheckedChange={(checked) => toggleBooleanRule(selectedPerspective, key, !!checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className='grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]'>
                  <label className='text-xs font-medium text-muted-foreground md:pt-2'>Date fields</label>
                  <div className='grid gap-3 sm:grid-cols-3'>
                    {DATE_FIELD_OPTIONS.map((dateField) => (
                      <label key={dateField} className='flex items-center gap-2 text-sm capitalize'>
                        <Checkbox
                          checked={(sanitizeManagedRules(selectedPerspective.rules ?? {}).dateFields ?? []).includes(dateField)}
                          onCheckedChange={(checked) => toggleDateField(selectedPerspective, dateField, !!checked)}
                        />
                        {dateField}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

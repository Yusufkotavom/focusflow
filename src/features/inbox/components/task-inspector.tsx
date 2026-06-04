import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { CalendarDays, Flag, Repeat, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'
import { repeatRuleLabel, type RepeatRule } from '@/lib/recurrence'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSupabase } from '@/hooks/use-supabase'
import { useTagsData } from '@/hooks/use-tags-data'
import { useTaskTags } from '@/hooks/use-task-tags'
import { useTasksData } from '@/hooks/use-tasks-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'

type Task = {
  id: string
  title: string
  note?: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  defer_date?: string
  planned_date?: string
  due_date?: string
  project_id?: string | null
  completed_at?: string | null
  repeat_rule?: RepeatRule | null
}

type ProjectOption = {
  id: string
  name: string
}

type TagOption = {
  id: string
  name: string
}

function InspectorField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <label className='text-[11px] font-medium text-muted-foreground'>
        {label}
      </label>
      {children}
    </div>
  )
}

function CompactField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex w-[11.5rem] shrink-0 flex-col gap-2 py-1 sm:w-[13.5rem]'>
      <span className='text-[10px] font-medium text-muted-foreground'>
        {label}
      </span>
      <div className='flex min-w-0 items-center gap-2'>{children}</div>
    </div>
  )
}

function CompactButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant='outline'
      size='sm'
      className={`h-8 w-full justify-between gap-2 rounded-lg px-2 text-xs ${className ?? ''}`}
      {...props}
    >
      {children}
    </Button>
  )
}

function CompactSelectField({
  label,
  value,
  placeholder,
  onValueChange,
  children,
}: {
  label: string
  value: string
  placeholder: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <CompactField label={label}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className='h-8 w-full gap-2 px-2 text-xs'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </CompactField>
  )
}

function CompactDateField({
  label,
  value,
  placeholder,
  onSelect,
}: {
  label: string
  value?: string
  placeholder: string
  onSelect: (date: Date | undefined) => void
}) {
  const selected = value ? new Date(value) : undefined

  return (
    <CompactField label={label}>
      <DatePicker
        selected={selected}
        onSelect={onSelect}
        placeholder={placeholder}
        buttonClassName='h-8 w-full px-2 text-xs'
        contentClassName='w-auto'
      />
      {selected ? (
        <Button
          variant='ghost'
          size='sm'
          className='h-8 shrink-0 px-2 text-xs'
          onClick={() => onSelect(undefined)}
        >
          Clear
        </Button>
      ) : null}
    </CompactField>
  )
}

function dateSummary(value?: string) {
  return value ? format(new Date(value), 'MMM d, yyyy') : 'Not set'
}

function tagSummary(names: string[]) {
  if (names.length === 0) return 'No tags'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
}

export function TaskInspectorPanel() {
  const { isInspectorOpen, selectedTaskId, setSelectedTask } = useAppStore()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const getSupabase = useSupabase()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const { projects } = useTasksData()
  const { tags } = useTagsData()
  const { taskTags, toggleTaskTag } = useTaskTags(selectedTaskId)
  const isMobile = useIsMobile()
  const tasksQueryKey = ['tasks', userId, getSupabase] as const
  const selectedTagNames = (tags as TagOption[])
    .filter((tag) => taskTags.includes(tag.id))
    .map((tag) => tag.name)

  useEffect(() => {
    let channel: { unsubscribe: () => void } | undefined

    async function setupTask() {
      if (!selectedTaskId) {
        setTask(null)
        return
      }

      setLoading(true)
      try {
        const supabase = await getSupabase()
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', selectedTaskId)
          .single()
        if (error) throw error
        setTask(data)

        channel = supabase
          .channel(`task-${selectedTaskId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tasks',
              filter: `id=eq.${selectedTaskId}`,
            },
            (payload) => {
              setTask(payload.new as Task)
            }
          )
          .subscribe()
      } catch {
        toast.error('Failed to load task details')
        setSelectedTask(null)
      } finally {
        setLoading(false)
      }
    }

    setupTask()

    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [selectedTaskId, getSupabase, setSelectedTask])

  async function updateTask(updates: Partial<Task>) {
    if (!task) return
    const previousTask = task
    const nextTask = { ...task, ...updates } as Task
    setTask(nextTask)

    queryClient.setQueryData(tasksQueryKey, (old: Task[] | undefined) =>
      old?.map((item) => {
        if (item.id !== task.id) return item
        const payload =
          updates.status === 'completed'
            ? { ...updates, completed_at: new Date().toISOString() }
            : updates.status
              ? { ...updates, completed_at: null }
              : updates
        return { ...item, ...payload }
      })
    )

    try {
      const supabase = await getSupabase()
      const payload = { ...updates }
      if (updates.status === 'completed')
        payload.completed_at = new Date().toISOString()
      else if (updates.status) payload.completed_at = null

      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    } catch {
      setTask(previousTask)
      toast.error('Failed to save changes')
      queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    }
  }

  const updateDateField = (
    field: 'defer_date' | 'planned_date' | 'due_date',
    date: Date | undefined
  ) => {
    updateTask({ [field]: date ? date.toISOString() : null } as Partial<Task>)
  }

  const assignProject = (projectId: string) => {
    const nextProjectId = projectId === 'none' ? null : projectId
    const updates: Partial<Task> = { project_id: nextProjectId }

    if (task?.status === 'inbox' && nextProjectId) {
      updates.status = 'active'
    }

    updateTask(updates)
  }

  if (!isInspectorOpen) return null

  const content = (
    <>
      <div className='flex flex-shrink-0 items-start justify-between px-4 pt-4 pb-3'>
        <div className='min-w-0'>
          <h2 className='truncate text-sm font-medium'>Task details</h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            Edit title, notes, and schedule.
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 shrink-0 rounded-full'
          onClick={() => setSelectedTask(null)}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div className='min-h-0 min-w-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-4 pb-4'>
        {!task || loading ? (
          <p className='text-sm text-muted-foreground'>Loading details...</p>
        ) : (
          <>
            <InspectorField label='Title'>
              <Input
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                onBlur={(e) => updateTask({ title: e.target.value })}
                className='text-sm'
              />
            </InspectorField>

            <InspectorField label='Description'>
              <Textarea
                value={task.note || ''}
                onChange={(e) => setTask({ ...task, note: e.target.value })}
                onBlur={(e) => updateTask({ note: e.target.value })}
                placeholder='Add a note...'
                className='min-h-20 resize-none text-sm'
              />
            </InspectorField>

            <Separator className='opacity-60' />

            <div className='-mx-4 [touch-action:pan-x] overflow-x-auto overflow-y-hidden px-4 pb-2'>
              <div className='flex w-max min-w-full gap-3 pe-4'>
                <CompactSelectField
                  label='Project'
                  value={task.project_id ?? 'none'}
                  placeholder='No Project'
                  onValueChange={assignProject}
                >
                  <SelectItem value='none'>No Project</SelectItem>
                  {(projects as ProjectOption[]).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </CompactSelectField>

                <CompactField label='Tags'>
                  {tags.length === 0 ? (
                    <span className='text-xs text-muted-foreground'>
                      No tags
                    </span>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <CompactButton>
                          <span className='truncate'>
                            {tagSummary(selectedTagNames)}
                          </span>
                          <Tag className='h-3.5 w-3.5 shrink-0 opacity-60' />
                        </CompactButton>
                      </PopoverTrigger>
                      <PopoverContent align='end' className='w-64 p-3'>
                        <div className='space-y-2'>
                          <p className='text-xs font-medium text-muted-foreground'>
                            Tags
                          </p>
                          <div className='flex flex-wrap gap-2'>
                            {(tags as TagOption[]).map((tag) => {
                              const selected = taskTags.includes(tag.id)
                              return (
                                <Badge
                                  key={tag.id}
                                  variant={selected ? 'default' : 'outline'}
                                  className='cursor-pointer'
                                  onClick={() => toggleTaskTag(tag.id)}
                                >
                                  {tag.name}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </CompactField>

                <CompactSelectField
                  label='Status'
                  value={task.status}
                  placeholder='Status'
                  onValueChange={(value) =>
                    updateTask({ status: value as Task['status'] })
                  }
                >
                  <SelectItem value='inbox'>Inbox</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='dropped'>Dropped</SelectItem>
                </CompactSelectField>

                <CompactField label='Flag'>
                  <CompactButton
                    onClick={() => updateTask({ flagged: !task.flagged })}
                  >
                    <span>{task.flagged ? 'Flagged' : 'Not flagged'}</span>
                    <Flag
                      className={`h-3.5 w-3.5 shrink-0 ${task.flagged ? 'text-orange-500' : 'opacity-60'}`}
                    />
                  </CompactButton>
                </CompactField>

                <CompactDateField
                  label='Defer'
                  value={task.defer_date}
                  placeholder='Not set'
                  onSelect={(date) => updateDateField('defer_date', date)}
                />
                <CompactDateField
                  label='Planned'
                  value={task.planned_date}
                  placeholder='Not set'
                  onSelect={(date) => updateDateField('planned_date', date)}
                />
                <CompactDateField
                  label='Due'
                  value={task.due_date}
                  placeholder='Not set'
                  onSelect={(date) => updateDateField('due_date', date)}
                />

                <CompactSelectField
                  label='Repeat'
                  value={task.repeat_rule ?? 'none'}
                  placeholder='No repeat'
                  onValueChange={(value) =>
                    updateTask({
                      repeat_rule:
                        value === 'none' ? null : (value as RepeatRule),
                    })
                  }
                >
                  <SelectItem value='none'>No repeat</SelectItem>
                  <SelectItem value='daily'>Daily</SelectItem>
                  <SelectItem value='weekly'>Weekly</SelectItem>
                  <SelectItem value='monthly'>Monthly</SelectItem>
                  <SelectItem value='yearly'>Yearly</SelectItem>
                </CompactSelectField>
              </div>
            </div>

            {task.defer_date ||
            task.planned_date ||
            task.due_date ||
            task.repeat_rule ? (
              <div className='rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <CalendarDays className='h-3.5 w-3.5' />
                  Defer: {dateSummary(task.defer_date)}
                </div>
                <div className='mt-1 flex items-center gap-2'>
                  <CalendarDays className='h-3.5 w-3.5' />
                  Planned: {dateSummary(task.planned_date)}
                </div>
                <div className='mt-1 flex items-center gap-2'>
                  <CalendarDays className='h-3.5 w-3.5' />
                  Due: {dateSummary(task.due_date)}
                </div>
                {task.repeat_rule ? (
                  <div className='mt-1 flex items-center gap-2'>
                    <Repeat className='h-3.5 w-3.5' />
                    Repeats: {repeatRuleLabel(task.repeat_rule)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Dialog
        open={isInspectorOpen}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent
          showCloseButton={false}
          className='flex h-[92svh] max-w-md flex-col overflow-hidden p-0'
        >
          <DialogHeader className='sr-only'>
            <DialogTitle>Task Inspector</DialogTitle>
          </DialogHeader>
          <div className='flex h-full flex-col'>{content}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className='h-svh w-72 flex-shrink-0 border-l bg-background'>
      {content}
    </div>
  )
}

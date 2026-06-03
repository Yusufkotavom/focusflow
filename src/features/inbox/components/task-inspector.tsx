import { X, Flag, Calendar, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

type Task = {
  id: string
  title: string
  note?: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  deferDate?: string
  plannedDate?: string
  dueDate?: string
  project?: string
  tags?: string[]
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
      <label className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
        {label}
      </label>
      {children}
    </div>
  )
}

function DateField({
  label,
  value,
  placeholder,
}: {
  label: string
  value?: string
  placeholder: string
}) {
  return (
    <InspectorField label={label}>
      <button className='flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent'>
        <Calendar className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ?? placeholder}
        </span>
      </button>
    </InspectorField>
  )
}

export function TaskInspectorPanel() {
  const { isInspectorOpen, selectedTaskId, setSelectedTask } = useAppStore()

  if (!isInspectorOpen || !selectedTaskId) return null

  const mockTask: Task = {
    id: selectedTaskId,
    title: 'Task details loading...',
    status: 'inbox',
    flagged: false,
    tags: [],
  }

  return (
    <div className='flex h-svh w-72 flex-shrink-0 flex-col border-l bg-background'>
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-b px-3'>
        <span className='text-sm font-medium'>Inspector</span>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={() => setSelectedTask(null)}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        <InspectorField label='Title'>
          <Input defaultValue={mockTask.title} className='text-sm' />
        </InspectorField>

        <InspectorField label='Note'>
          <Textarea
            placeholder='Add a note...'
            className='min-h-20 resize-none text-sm'
          />
        </InspectorField>

        <Separator />

        <InspectorField label='Project'>
          <button className='flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent'>
            <span className='text-muted-foreground'>No Project</span>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </button>
        </InspectorField>

        <InspectorField label='Tags'>
          <button className='flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent'>
            <span className='text-muted-foreground'>No Tags</span>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </button>
        </InspectorField>

        <Separator />

        <InspectorField label='Status'>
          <div className='flex flex-wrap gap-2'>
            {(['inbox', 'active', 'completed', 'dropped'] as const).map((s) => (
              <Badge
                key={s}
                variant={mockTask.status === s ? 'default' : 'outline'}
                className='cursor-pointer text-xs capitalize'
              >
                {s}
              </Badge>
            ))}
          </div>
        </InspectorField>

        <InspectorField label='Flag'>
          <button className='flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent'>
            <Flag
              className={`h-3.5 w-3.5 ${mockTask.flagged ? 'text-orange-500' : 'text-muted-foreground'}`}
            />
            <span
              className={
                mockTask.flagged ? 'text-orange-500' : 'text-muted-foreground'
              }
            >
              {mockTask.flagged ? 'Flagged' : 'Not Flagged'}
            </span>
          </button>
        </InspectorField>

        <Separator />

        <DateField
          label='Defer Date'
          placeholder='Not set — always available'
        />
        <DateField label='Planned Date' placeholder='Not scheduled' />
        <DateField label='Due Date' placeholder='No deadline' />

        <Separator />

        <InspectorField label='Repeat'>
          <button className='flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent'>
            <span className='text-muted-foreground'>None</span>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </button>
        </InspectorField>
      </div>

      <div className='flex flex-shrink-0 gap-2 border-t p-3'>
        <Button variant='outline' size='sm' className='flex-1 text-xs'>
          Move to Project
        </Button>
        <Button variant='destructive' size='sm' className='text-xs'>
          Drop
        </Button>
      </div>
    </div>
  )
}

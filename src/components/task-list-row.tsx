import { AlertCircle, CalendarDays, CheckCircle2, Circle, Flag, GitFork, Paperclip, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

type TaskListRowProps = {
  task: {
    id: string
    title: string
    status: 'inbox' | 'active' | 'completed' | 'dropped'
    flagged?: boolean
    project_id?: string | null
    note?: string | null
  }
  isSelected?: boolean
  onSelect?: () => void
  onComplete?: () => void
  subtitle?: string
  overdue?: boolean
  showCompletedState?: boolean
  projectName?: string
  repeatLabel?: string | null
  tags?: string[]
  attachmentCount?: number
  subtaskCount?: number
}

export function TaskListRow({
  task,
  isSelected = false,
  onSelect,
  onComplete,
  subtitle,
  overdue = false,
  showCompletedState = false,
  projectName,
  repeatLabel,
  tags = [],
  attachmentCount = 0,
  subtaskCount = 0,
}: TaskListRowProps) {
  const canShowCompleted = showCompletedState && task.status === 'completed'
  const note = task.note?.trim()

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer items-start gap-2 border-b border-border/50 px-4 py-2.5 transition-colors hover:bg-accent/50',
        isSelected && 'bg-accent'
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onComplete?.()
        }}
        className='flex-shrink-0 text-muted-foreground hover:text-primary transition-colors'
      >
        {canShowCompleted ? (
          <CheckCircle2 className='h-4 w-4 text-primary' />
        ) : (
          <Circle className='h-4 w-4' />
        )}
      </button>

      <div className='flex min-h-8 flex-1 flex-col gap-1 text-left'>
        <div className='w-full min-w-0 text-sm whitespace-normal break-words [overflow-wrap:anywhere]'>
          <span className={cn(canShowCompleted && 'line-through text-muted-foreground')}>
            {task.title}
          </span>
          {note ? <span className='text-muted-foreground'> - {note.slice(0, 140)}</span> : null}
        </div>

        {subtitle || projectName || overdue || repeatLabel || tags.length > 0 || attachmentCount > 0 || subtaskCount > 0 ? (
          <div className='w-full min-w-0 space-y-1'>
            <div className='flex min-w-0 flex-wrap items-center gap-1'>
              {projectName ? (
                <span className='inline-flex max-w-full items-center rounded-md border border-border bg-muted px-1 py-0.5 text-[10px] font-medium text-foreground'>
                  {projectName}
                </span>
              ) : null}
              {subtaskCount > 0 ? (
                <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-1 py-0.5 text-[10px] font-medium text-foreground'>
                  <GitFork className='h-2.5 w-2.5' />
                  {subtaskCount}
                </span>
              ) : null}
              {attachmentCount > 0 ? (
                <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-1 py-0.5 text-[10px] font-medium text-foreground'>
                  <Paperclip className='h-2.5 w-2.5' />
                  {attachmentCount}
                </span>
              ) : null}
              {overdue ? (
                <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-red-300 bg-red-50 px-1 py-0.5 text-[10px] font-semibold text-red-700'>
                  <AlertCircle className='h-2.5 w-2.5' />
                  Overdue
                </span>
              ) : null}
              {subtitle ? (
                <span className='inline-flex shrink-0 items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-1 py-0.5 text-[10px] font-semibold text-sky-700'>
                  <CalendarDays className='h-2.5 w-2.5' />
                  {subtitle}
                </span>
              ) : null}
              {repeatLabel ? (
                <span className='inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700'>
                  Repeats {repeatLabel.toLowerCase()}
                </span>
              ) : null}
            </div>
            {tags.length > 0 ? (
              <div className='flex min-w-0 items-center'>
                <span className='inline-flex min-w-0 max-w-[14rem] items-center gap-1 overflow-hidden rounded-md border border-emerald-300 bg-emerald-50 px-1 py-0.5 text-[10px] font-medium text-emerald-700'>
                  <Tag className='h-2.5 w-2.5 shrink-0' />
                  <span className='truncate whitespace-nowrap'>#{tags.join(' #')}</span>
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {task.flagged ? <Flag className='h-3.5 w-3.5 flex-shrink-0 text-orange-500' /> : null}
    </div>
  )
}

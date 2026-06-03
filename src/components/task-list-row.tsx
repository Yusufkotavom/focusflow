import { AlertCircle, CheckCircle2, Circle, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

type TaskListRowProps = {
  task: {
    id: string
    title: string
    status: 'inbox' | 'active' | 'completed' | 'dropped'
    flagged?: boolean
    project_id?: string | null
  }
  isSelected?: boolean
  onSelect?: () => void
  onComplete?: () => void
  subtitle?: string
  overdue?: boolean
  showCompletedState?: boolean
  projectName?: string
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
}: TaskListRowProps) {
  const canShowCompleted = showCompletedState && task.status === 'completed'

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent/50',
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

      <div className='min-w-0 flex-1'>
        <div
          className={cn(
            'truncate text-sm',
            canShowCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </div>

        {subtitle || projectName || overdue ? (
          <div className='mt-0.5 flex items-center gap-2 text-xs text-muted-foreground'>
            {overdue ? (
              <span className='inline-flex items-center gap-1 text-red-500'>
                <AlertCircle className='h-3 w-3' />
                Overdue
              </span>
            ) : null}
            {subtitle ? <span>{subtitle}</span> : null}
            {!subtitle && projectName ? <span>{projectName}</span> : null}
          </div>
        ) : null}
      </div>

      {task.flagged ? <Flag className='h-3.5 w-3.5 flex-shrink-0 text-orange-500' /> : null}
    </div>
  )
}

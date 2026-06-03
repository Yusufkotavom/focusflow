import { Folder } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ProjectListRow({
  project,
  nextAction,
  taskCount = 0,
  completedCount = 0,
  onSelect,
  actions,
}: {
  project: { id: string; name: string; status: string; type: string }
  nextAction?: string
  taskCount?: number
  completedCount?: number
  onSelect?: () => void
  actions?: React.ReactNode
}) {
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0

  return (
    <div className='group border-b border-border/50 transition-colors hover:bg-accent/50'>
      <div className='flex items-center gap-3 px-4 py-3'>
        <button
          type='button'
          onClick={onSelect}
          className='flex min-w-0 flex-1 items-center gap-3 text-left'
        >
          <Folder className='h-4 w-4 flex-shrink-0 text-blue-500' />
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <span className='truncate text-sm font-medium'>{project.name}</span>
              <Badge variant='outline' className='h-5 text-[10px] capitalize'>{project.status}</Badge>
              <Badge variant='secondary' className='h-5 text-[10px] capitalize'>{project.type}</Badge>
            </div>
            {nextAction ? (
              <p className='mt-0.5 truncate text-xs text-muted-foreground'>Next: {nextAction}</p>
            ) : taskCount > 0 ? (
              <p className='mt-0.5 text-xs text-muted-foreground'>{taskCount} tasks</p>
            ) : (
              <p className='mt-0.5 text-xs text-muted-foreground/60'>No tasks yet</p>
            )}
          </div>
        </button>

        {actions ? (
          <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
            {actions}
          </div>
        ) : null}
      </div>

      {taskCount > 0 ? (
        <div className='mx-4 mb-2 h-1 overflow-hidden rounded-full bg-muted'>
          <div className='h-full rounded-full bg-primary transition-all' style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  )
}

import { Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProjectListRow({
  project,
  isSelected = false,
  onSelect,
  subtitle,
  meta,
}: {
  project: { id: string; name: string }
  isSelected?: boolean
  onSelect?: () => void
  subtitle?: string
  meta?: string
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'w-full border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-accent/50',
        isSelected && 'bg-accent'
      )}
    >
      <div className='flex items-center gap-2'>
        <Folder className='h-4 w-4 flex-shrink-0 text-blue-500' />
        <span className='truncate text-sm font-medium'>{project.name}</span>
      </div>
      {subtitle || meta ? (
        <div className='mt-1 pl-6 text-xs text-muted-foreground'>
          {subtitle ? <div className='truncate'>{subtitle}</div> : null}
          {meta ? <div>{meta}</div> : null}
        </div>
      ) : null}
    </button>
  )
}

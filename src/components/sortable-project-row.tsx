import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

export function SortableProjectRow({
  projectId,
  children,
  className,
}: {
  projectId: string
  children: React.ReactNode
  className?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: projectId })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group relative motion-safe:transition-[transform,opacity,filter] motion-safe:duration-200 motion-safe:ease-out',
        isDragging && 'z-20 opacity-70 drop-shadow-lg',
        className
      )}
      {...attributes}
    >
      <div
        className='absolute inset-x-1/4 top-1/2 z-10 h-10 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing'
        {...listeners}
      />
      <div
        className={cn(
          'relative motion-safe:transition-[transform,background-color,box-shadow] motion-safe:duration-200',
          isDragging && 'scale-[1.01] rounded-lg bg-muted/70 shadow-xl'
        )}
      >
        {children}
      </div>
    </div>
  )
}

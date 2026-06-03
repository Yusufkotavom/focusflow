import { Badge } from '@/components/ui/badge'
import { ProjectTaskList } from './project-task-list'

export function ProjectDetail({
  project,
  tasks,
  projectsMap,
  selectedTaskId,
  onSelectTask,
}: {
  project: any
  tasks: any[]
  projectsMap: Record<string, any>
  selectedTaskId: string | null
  onSelectTask: (taskId: string | null) => void
}) {
  return (
    <div className='flex min-h-[500px] flex-col rounded-lg border bg-card'>
      <div className='border-b p-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-base font-semibold'>{project.name}</h2>
          <Badge variant='outline' className='capitalize'>{project.status}</Badge>
          <Badge variant='secondary' className='capitalize'>{project.type}</Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Manage task ordering, subtasks, and next actions for this project.
        </p>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto p-4'>
        <ProjectTaskList
          project={project}
          tasks={tasks}
          projectsMap={projectsMap}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  )
}

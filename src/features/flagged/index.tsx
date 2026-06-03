import { Flag } from 'lucide-react'
import { TaskCollectionView } from '@/components/task-collection-view'
import { useTasksData } from '@/hooks/use-tasks-data'
import { defaultPerspectiveDefinitions } from '@/lib/perspective-engine'

export function Flagged() {
  const { tasks, projects } = useTasksData()
  const projectNameById = projects.reduce<Record<string, string>>((acc, project: any) => {
    acc[project.id] = project.name
    return acc
  }, {})

  return (
    <TaskCollectionView
      perspective={defaultPerspectiveDefinitions.flagged}
      tasks={tasks}
      projects={projects}
      projectNameById={projectNameById}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Flag className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No flagged items</p>
          <p className='text-xs text-muted-foreground mt-1'>Flag tasks to mark them as important.</p>
        </div>
      }
    />
  )
}

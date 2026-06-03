import { Inbox, Archive, Clock3, FolderX, PauseCircle } from 'lucide-react'
import { TaskCollectionView } from '@/components/task-collection-view'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'
import { useTasksData } from '@/hooks/use-tasks-data'
import { defaultPerspectiveDefinitions, type PerspectiveDefinition } from '@/lib/perspective-engine'

type ProjectNameRecord = {
  id: string
  name: string
}

function buildProjectNameMap(projects: ProjectNameRecord[]) {
  return projects.reduce<Record<string, string>>((acc, project) => {
    acc[project.id] = project.name
    return acc
  }, {})
}

export function NoProjectPerspective() {
  const { tasks, projects } = useTasksData()

  return (
    <TaskCollectionView
      perspective={defaultPerspectiveDefinitions['no-project']}
      tasks={tasks}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <FolderX className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No loose tasks</p>
          <p className='text-xs text-muted-foreground mt-1'>Everything is assigned to a project.</p>
        </div>
      }
    />
  )
}

export function DeferredPerspective() {
  const { tasks, projects } = useTasksData()

  return (
    <TaskCollectionView
      perspective={defaultPerspectiveDefinitions.deferred}
      tasks={tasks}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Clock3 className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No deferred tasks</p>
          <p className='text-xs text-muted-foreground mt-1'>Nothing is hidden for the future right now.</p>
        </div>
      }
    />
  )
}

export function CompletedPerspective() {
  const { tasks, projects } = useTasksData()

  return (
    <TaskCollectionView
      perspective={defaultPerspectiveDefinitions.completed}
      tasks={tasks}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Archive className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>Nothing completed yet</p>
          <p className='text-xs text-muted-foreground mt-1'>Completed tasks will show up here.</p>
        </div>
      }
    />
  )
}

export function DroppedPerspective() {
  const { tasks, projects } = useTasksData()

  return (
    <TaskCollectionView
      perspective={defaultPerspectiveDefinitions.dropped}
      tasks={tasks}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <PauseCircle className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No dropped tasks</p>
          <p className='text-xs text-muted-foreground mt-1'>Dropped tasks will show here for reference.</p>
        </div>
      }
    />
  )
}

export function WaitingPerspective() {
  const { tasks, projects } = useTasksData()
  return (
    <TaskCollectionView
      perspective={{
        id: 'waiting',
        name: 'Waiting',
        description: 'Waiting-on tasks are not modeled yet',
        rules: { statuses: [] },
        groupBy: 'none',
        sortBy: 'manual',
      }}
      tasks={tasks.filter(() => false)}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Inbox className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>Waiting is not modeled yet</p>
          <p className='text-xs text-muted-foreground mt-1'>We can add dedicated waiting semantics in the next pass.</p>
        </div>
      }
    />
  )
}

export function CustomPerspectiveView({ perspective }: { perspective: PerspectiveDefinition }) {
  const { tasks, projects } = useTasksData()
  const { updatePerspective } = usePerspectivesData()
  return (
    <TaskCollectionView
      perspective={perspective}
      tasks={tasks}
      projects={projects}
      projectNameById={buildProjectNameMap(projects)}
      onViewOptionsChange={(updates) => updatePerspective(perspective.id, updates)}
      empty={
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Inbox className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No matching tasks</p>
          <p className='text-xs text-muted-foreground mt-1'>Adjust the perspective filters or grouping.</p>
        </div>
      }
    />
  )
}

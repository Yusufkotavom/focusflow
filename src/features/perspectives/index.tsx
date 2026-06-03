import { Inbox, Archive, Clock3, FolderX, PauseCircle } from 'lucide-react'
import { TaskCollectionView } from '@/components/task-collection-view'
import { useTasksData } from '@/hooks/use-tasks-data'

function buildProjectNameMap(projects: any[]) {
  return projects.reduce<Record<string, string>>((acc, project) => {
    acc[project.id] = project.name
    return acc
  }, {})
}

export function NoProjectPerspective() {
  const { tasks, projects } = useTasksData()
  const viewTasks = tasks.filter((task: any) => !task.project_id && task.status !== 'dropped' && task.status !== 'completed')

  return (
    <TaskCollectionView
      title='No Project'
      description={`Tasks that are not assigned to a project (${viewTasks.length})`}
      tasks={viewTasks}
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
  const now = new Date()
  const viewTasks = tasks.filter((task: any) => task.defer_date && new Date(task.defer_date) > now && task.status !== 'completed' && task.status !== 'dropped')

  return (
    <TaskCollectionView
      title='Deferred'
      description={`Tasks that are hidden until later (${viewTasks.length})`}
      tasks={viewTasks}
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
  const viewTasks = tasks.filter((task: any) => task.status === 'completed')

  return (
    <TaskCollectionView
      title='Completed'
      description={`Recently finished work (${viewTasks.length})`}
      tasks={viewTasks}
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
  const viewTasks = tasks.filter((task: any) => task.status === 'dropped')

  return (
    <TaskCollectionView
      title='Dropped'
      description={`Tasks you decided not to do (${viewTasks.length})`}
      tasks={viewTasks}
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
  const { projects } = useTasksData()
  return (
    <TaskCollectionView
      title='Waiting'
      description='Waiting-on tasks are not modeled yet'
      tasks={[]}
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

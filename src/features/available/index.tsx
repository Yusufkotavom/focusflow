import { ListTodo, Circle, Flag } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { isTaskAvailable } from '@/features/tasks/utils/availability'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export function Available() {
  const { tasks, projects, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask } = useTaskMutations()

  // Convert projects array to record map for the engine
  const projectsMap = projects.reduce((acc: any, p: any) => {
    acc[p.id] = p
    return acc
  }, {})

  // Filter tasks using Availability Engine
  const availableTasks = tasks.filter((t: any) => isTaskAvailable(t, projectsMap, tasks))

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Available</h1>
          <p className='text-xs text-muted-foreground'>Tasks you can work on right now ({availableTasks.length})</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      
      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
             <p className='text-sm text-muted-foreground text-center mt-10'>Loading...</p>
          ) : availableTasks.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <ListTodo className='h-12 w-12 text-muted-foreground/30 mb-3' />
              <p className='text-sm font-medium text-muted-foreground'>No available tasks</p>
              <p className='text-xs text-muted-foreground mt-1'>You're all caught up! Or maybe things are deferred or blocked.</p>
            </div>
          ) : (
            availableTasks.map((task: any) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/50',
                  'hover:bg-accent/50 transition-colors',
                  selectedTaskId === task.id && 'bg-accent'
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    completeTask(task.id)
                  }}
                  className='flex-shrink-0 text-muted-foreground hover:text-primary transition-colors'
                >
                  <Circle className='h-4 w-4' />
                </button>

                <div className='flex-1 flex flex-col'>
                  <span className='text-sm'>{task.title}</span>
                  {task.project_id && projectsMap[task.project_id] && (
                    <span className='text-xs text-muted-foreground mt-0.5'>
                      {projectsMap[task.project_id].name}
                    </span>
                  )}
                </div>

                {task.flagged && <Flag className='h-3.5 w-3.5 text-orange-500 flex-shrink-0' />}
              </div>
            ))
          )}
        </div>
      </Main>
    </>
  )
}

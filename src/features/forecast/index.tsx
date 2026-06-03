import { CalendarDays, Circle, Flag, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { buildForecastSections, forecastDateLabel } from './utils'
import { isTaskOverdue } from '@/features/tasks/utils/availability'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export function Forecast() {
  const { tasks, projects, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask } = useTaskMutations()

  const sections = buildForecastSections(tasks as any[], projects as any[])

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Forecast</h1>
          <p className='text-xs text-muted-foreground'>Your schedule at a glance</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        {isLoading ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <p className='text-sm text-muted-foreground'>Loading forecast...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <CalendarDays className='h-12 w-12 text-muted-foreground/30 mb-3' />
            <p className='text-sm font-medium text-muted-foreground'>No items scheduled</p>
            <p className='text-xs text-muted-foreground mt-1'>Assign defer, planned, or due dates to see them here.</p>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto'>
            {sections.map((section) => (
              <section key={section.key} className='border-b last:border-b-0'>
                <div className='sticky top-0 z-10 bg-background/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur'>
                  {section.title}
                </div>

                {section.tasks.map((task: any) => (
                  <div
                    key={`${section.key}-${task.id}`}
                    onClick={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 border-t px-4 py-3 transition-colors hover:bg-accent/50',
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
                      <Circle className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                    </button>

                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm'>{task.title}</div>
                      <div className='mt-0.5 flex items-center gap-2 text-xs text-muted-foreground'>
                        {isTaskOverdue(task) ? (
                          <span className='inline-flex items-center gap-1 text-red-500'>
                            <AlertCircle className='h-3 w-3' />
                            Overdue
                          </span>
                        ) : null}
                        <span>{forecastDateLabel(task)}</span>
                      </div>
                    </div>

                    {task.flagged ? <Flag className='h-3.5 w-3.5 flex-shrink-0 text-orange-500' /> : null}
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}

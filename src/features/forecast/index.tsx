import { CalendarDays } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import { buildForecastSections, forecastDateLabel } from './utils'
import { isTaskOverdue } from '@/features/tasks/utils/availability'
import { useAppStore } from '@/stores/app-store'
import { TaskListRow } from '@/components/task-list-row'
import { taskRepeatLabel } from '@/lib/task-display'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useState } from 'react'

export function Forecast() {
  const { tasks, projects, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask } = useTaskMutations()
  const { taskTagsMap } = useTaskMetadata()
  const [showCompleted, setShowCompleted] = useState(false)
  const [showDropped, setShowDropped] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'status' | 'tag' | 'due' | 'planned' | 'defer'>('none')
  const [rules, setRules] = useState({})

  const sections = buildForecastSections(tasks as any[], projects as any[])

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Forecast</h1>
          <p className='text-xs text-muted-foreground'>Your schedule at a glance</p>
        </div>
        <ThemeSwitch />
        <PerspectiveActionsMenu
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          showDropped={showDropped}
          setShowDropped={setShowDropped}
          rules={rules}
          setRules={setRules}
        />
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
                  <TaskListRow
                    key={`${section.key}-${task.id}`}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                    onComplete={() => completeTask(task.id)}
                    subtitle={forecastDateLabel(task)}
                    overdue={isTaskOverdue(task)}
                    repeatLabel={taskRepeatLabel(task)}
                    tags={taskTagsMap[task.id] ?? []}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}

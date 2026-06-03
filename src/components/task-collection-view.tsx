import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { TaskListRow } from '@/components/task-list-row'
import { useAppStore } from '@/stores/app-store'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import { taskRepeatLabel, taskScheduleLabel } from '@/lib/task-display'

export function TaskCollectionView({
  title,
  description,
  tasks,
  empty,
  projectNameById,
}: {
  title: string
  description: string
  tasks: any[]
  empty: React.ReactNode
  projectNameById?: Record<string, string>
}) {
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask } = useTaskMutations()
  const { taskTagsMap } = useTaskMetadata()

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>{title}</h1>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <div className='flex-1 overflow-y-auto'>
          {tasks.length === 0 ? (
            empty
          ) : (
            tasks.map((task: any) => (
              <TaskListRow
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                onComplete={() => completeTask(task.id)}
                showCompletedState
                subtitle={taskScheduleLabel(task)}
                repeatLabel={taskRepeatLabel(task)}
                projectName={task.project_id ? projectNameById?.[task.project_id] : undefined}
                tags={taskTagsMap[task.id] ?? []}
              />
            ))
          )}
        </div>
      </Main>
    </>
  )
}

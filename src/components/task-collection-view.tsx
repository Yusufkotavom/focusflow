import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { TaskListRow } from '@/components/task-list-row'
import { useAppStore } from '@/stores/app-store'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import { taskRepeatLabel, taskScheduleLabel } from '@/lib/task-display'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useMemo, useState } from 'react'
import { groupTasksForPerspective, type PerspectiveDefinition, type PerspectiveGroupBy } from '@/lib/perspective-engine'

export function TaskCollectionView({
  perspective,
  tasks,
  projects,
  empty,
  projectNameById,
}: {
  perspective: PerspectiveDefinition
  tasks: any[]
  projects: any[]
  empty: React.ReactNode
  projectNameById?: Record<string, string>
}) {
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask } = useTaskMutations()
  const { taskTagsMap, taskTagIdsMap } = useTaskMetadata()
  const [groupBy, setGroupBy] = useState<PerspectiveGroupBy>(perspective.groupBy)
  const [showCompleted, setShowCompleted] = useState(!!perspective.showCompleted)
  const [showDropped, setShowDropped] = useState(!!perspective.showDropped)
  const [rules, setRules] = useState(perspective.rules)

  const activePerspective = useMemo(
    () => ({ ...perspective, groupBy, showCompleted, showDropped, rules }),
    [perspective, groupBy, showCompleted, showDropped, rules]
  )

  const sections = useMemo(
    () => groupTasksForPerspective({ tasks, projects, taskTagsMap, taskTagIdsMap, definition: activePerspective }),
    [tasks, projects, taskTagsMap, taskTagIdsMap, activePerspective]
  )

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>{activePerspective.name}</h1>
          <p className='text-xs text-muted-foreground'>{activePerspective.description}</p>
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
        <div className='flex-1 overflow-y-auto'>
          {sections.every((section) => section.items.length === 0) ? (
            empty
          ) : (
            sections.map((section) => (
              <section key={section.key} className='border-b last:border-b-0'>
                {groupBy !== 'none' ? (
                  <div className='sticky top-0 z-10 bg-background/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur'>
                    {section.title}
                  </div>
                ) : null}
                {section.items.map((task: any) => (
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
                ))}
              </section>
            ))
          )}
        </div>
      </Main>
    </>
  )
}

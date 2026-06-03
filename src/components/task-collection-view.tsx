import { ChevronRight } from 'lucide-react'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { SortableTaskRow } from '@/components/sortable-task-row'
import { TaskListRow } from '@/components/task-list-row'
import { useAppStore } from '@/stores/app-store'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import { taskRepeatLabel, taskScheduleLabel } from '@/lib/task-display'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useMemo, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { groupTasksForPerspective, type PerspectiveDefinition, type PerspectiveGroupBy } from '@/lib/perspective-engine'

type CollectionTask = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged?: boolean
  project_id?: string | null
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
  repeat_rule?: string | null
}

type CollectionProject = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
}

export function TaskCollectionView({
  perspective,
  tasks,
  projects,
  empty,
  projectNameById,
  topContent,
  headerLeading,
  headerTrailing,
  onTaskComplete,
}: {
  perspective: PerspectiveDefinition
  tasks: CollectionTask[]
  projects: CollectionProject[]
  empty: React.ReactNode
  projectNameById?: Record<string, string>
  topContent?: React.ReactNode
  headerLeading?: React.ReactNode
  headerTrailing?: React.ReactNode
  onTaskComplete?: (taskId: string, status: CollectionTask['status']) => void
}) {
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const { completeTask, reorderTasks } = useTaskMutations()
  const { taskTagsMap, taskTagIdsMap } = useTaskMetadata()
  const [groupBy, setGroupBy] = useState<PerspectiveGroupBy>(perspective.groupBy)
  const [showCompleted, setShowCompleted] = useState(!!perspective.showCompleted)
  const [showDropped, setShowDropped] = useState(!!perspective.showDropped)
  const [rules, setRules] = useState(perspective.rules)
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({})
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const activePerspective = useMemo(
    () => ({ ...perspective, groupBy, showCompleted, showDropped, rules }),
    [perspective, groupBy, showCompleted, showDropped, rules]
  )

  const sections = useMemo(
    () => groupTasksForPerspective({ tasks, projects, taskTagsMap, taskTagIdsMap, definition: activePerspective }),
    [tasks, projects, taskTagsMap, taskTagIdsMap, activePerspective]
  )
  const activeTask = useMemo(
    () => sections.flatMap((section) => section.items).find((task) => task.id === activeTaskId) ?? null,
    [sections, activeTaskId]
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTaskId(null)
    if (!over || active.id === over.id || activePerspective.sortBy !== 'manual') return

    const activeId = String(active.id)
    const overId = String(over.id)
    const sourceSection = sections.find((section) => section.items.some((task) => task.id === activeId))
    const targetSection = sections.find((section) => section.items.some((task) => task.id === overId))
    if (!sourceSection || !targetSection || sourceSection.key !== targetSection.key) return

    const sourceIndex = sourceSection.items.findIndex((task) => task.id === activeId)
    const targetIndex = targetSection.items.findIndex((task) => task.id === overId)
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return

    const reordered = [...sourceSection.items]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    await reorderTasks(reordered.map((task) => task.id))
  }

  return (
    <>
      <Header>
        {headerLeading}
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
        {headerTrailing}
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        {topContent}
        <div className='flex-1 overflow-y-auto'>
          {sections.every((section) => section.items.length === 0) ? (
            empty
          ) : (
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragStart={(event: DragStartEvent) => setActiveTaskId(String(event.active.id))}
              onDragCancel={() => setActiveTaskId(null)}
              onDragEnd={handleDragEnd}
            >
              {sections.map((section) => (
                <Collapsible
                  key={section.key}
                  open={sectionOpen[section.key] ?? true}
                  onOpenChange={(open) => setSectionOpen((current) => ({ ...current, [section.key]: open }))}
                  className='border-b last:border-b-0'
                >
                  {groupBy !== 'none' ? (
                    <CollapsibleTrigger asChild>
                      <button
                        type='button'
                        className='flex w-full items-center gap-2 bg-background/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur'
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${(sectionOpen[section.key] ?? true) ? 'rotate-90' : ''}`}
                        />
                        <span className='flex-1'>{section.title}</span>
                        <span>{section.items.length}</span>
                      </button>
                    </CollapsibleTrigger>
                  ) : null}
                  <CollapsibleContent>
                    <SortableContext items={section.items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                      {section.items.map((task) => (
                        <SortableTaskRow key={task.id} taskId={task.id}>
                          <TaskListRow
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            onSelect={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                            onComplete={() => (onTaskComplete ? onTaskComplete(task.id, task.status) : completeTask(task.id))}
                            showCompletedState
                            subtitle={taskScheduleLabel(task)}
                            repeatLabel={taskRepeatLabel(task)}
                            projectName={task.project_id ? projectNameById?.[task.project_id] : undefined}
                            tags={taskTagsMap[task.id] ?? []}
                          />
                        </SortableTaskRow>
                      ))}
                    </SortableContext>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              <DragOverlay>
                {activeTask ? (
                  <div className='rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg'>
                    <p className='whitespace-normal break-words [overflow-wrap:anywhere]'>{activeTask.title}</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </Main>
    </>
  )
}

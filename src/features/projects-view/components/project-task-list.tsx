import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CornerDownRight, GripVertical, Plus } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TaskListRow } from '@/components/task-list-row'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/hooks/use-supabase'
import { useTaskMutations } from '@/hooks/use-task-mutations'
import { isTaskAvailable } from '@/features/tasks/utils/availability'

type Task = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  project_id?: string | null
  parent_task_id?: string | null
  order?: number | null
}

type Project = {
  id: string
  name: string
  type: 'parallel' | 'sequential' | 'single'
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
}

function SortableRow({
  task,
  selected,
  onSelect,
  onComplete,
  subtitle,
  children,
}: {
  task: Task
  selected: boolean
  onSelect: () => void
  onComplete: () => void
  subtitle?: string
  children?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}>
      <div className='flex items-stretch'>
        <button
          type='button'
          className='flex w-8 items-center justify-center border-b border-r bg-muted/20 text-muted-foreground hover:bg-accent/50'
          {...attributes}
          {...listeners}
        >
          <GripVertical className='h-4 w-4' />
        </button>
        <div className='min-w-0 flex-1'>
          <TaskListRow
            task={task}
            isSelected={selected}
            onSelect={onSelect}
            onComplete={onComplete}
            showCompletedState
            subtitle={subtitle}
          />
        </div>
      </div>
      {children}
    </div>
  )
}

export function ProjectTaskList({
  project,
  tasks,
  projectsMap,
  selectedTaskId,
  onSelectTask,
}: {
  project: Project
  tasks: Task[]
  projectsMap: Record<string, Project>
  selectedTaskId: string | null
  onSelectTask: (taskId: string | null) => void
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({})
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { completeTask } = useTaskMutations()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const topLevelTasks = useMemo(
    () => tasks.filter((task) => !task.parent_task_id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks]
  )

  const subtasksByParent = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const task of tasks) {
      if (!task.parent_task_id) continue
      groups[task.parent_task_id] ??= []
      groups[task.parent_task_id].push(task)
      groups[task.parent_task_id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return groups
  }, [tasks])

  async function createTask(title: string, parentTaskId?: string) {
    if (!title.trim() || !userId) return

    const siblings = tasks
      .filter((task) => (task.parent_task_id ?? null) === (parentTaskId ?? null))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const nextOrder = siblings.length === 0 ? 0 : (siblings[siblings.length - 1].order ?? 0) + 1
    const tempId = crypto.randomUUID()
    const tempTask = {
      id: tempId,
      title: title.trim(),
      status: 'active',
      flagged: false,
      user_id: userId,
      project_id: project.id,
      parent_task_id: parentTaskId ?? null,
      order: nextOrder,
      created_at: new Date().toISOString(),
    }

    queryClient.setQueryData(['tasks', userId], (old: any) => [...(old || []), tempTask])

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').insert([tempTask])
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error(parentTaskId ? 'Failed to create subtask' : 'Failed to create task')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  function reorder(items: Task[], activeId: string, overId: string) {
    const oldIndex = items.findIndex((item) => item.id === activeId)
    const newIndex = items.findIndex((item) => item.id === overId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return items
    return arrayMove(items, oldIndex, newIndex)
  }

  async function persistOrder(items: Task[]) {
    if (!userId) return

    const updates = items.map((item, index) => ({ id: item.id, order: index }))
    queryClient.setQueryData(['tasks', userId], (old: any) =>
      old?.map((task: any) => {
        const next = updates.find((update) => update.id === task.id)
        return next ? { ...task, order: next.order } : task
      })
    )

    try {
      const supabase = await getSupabase()
      for (const update of updates) {
        const { error } = await supabase.from('tasks').update({ order: update.order }).eq('id', update.id)
        if (error) throw error
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to reorder tasks')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  function handleTopLevelDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    void persistOrder(reorder(topLevelTasks, String(active.id), String(over.id)))
  }

  function handleSubtaskDragEnd(parentTaskId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    void persistOrder(reorder(subtasksByParent[parentTaskId] ?? [], String(active.id), String(over.id)))
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2'>
        <Plus className='h-4 w-4 text-muted-foreground' />
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void createTask(newTaskTitle)
              setNewTaskTitle('')
            }
          }}
          placeholder='Add task to project...'
          className='border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTopLevelDragEnd}>
        <SortableContext items={topLevelTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className='overflow-hidden rounded-lg border'>
            {topLevelTasks.map((task) => {
              const subtasks = subtasksByParent[task.id] ?? []
              const subtaskDraft = subtaskDrafts[task.id] ?? ''
              const nextAction = isTaskAvailable(task, projectsMap, tasks)

              return (
                <SortableRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskId === task.id}
                  onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
                  onComplete={() => completeTask(task.id)}
                  subtitle={project.type === 'sequential' && !nextAction ? 'Blocked by order' : nextAction ? 'Next action' : undefined}
                >
                  <div className='border-b bg-muted/10 px-4 py-2'>
                    <div className='ml-8 flex items-center gap-2 rounded-md bg-background px-2 py-1.5'>
                      <CornerDownRight className='h-3.5 w-3.5 text-muted-foreground' />
                      <Input
                        value={subtaskDraft}
                        onChange={(e) => setSubtaskDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void createTask(subtaskDraft, task.id)
                            setSubtaskDrafts((prev) => ({ ...prev, [task.id]: '' }))
                          }
                        }}
                        placeholder='Add subtask...'
                        className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
                      />
                    </div>
                  </div>

                  {subtasks.length > 0 ? (
                    <div className='border-b bg-muted/5 pl-8'>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleSubtaskDragEnd(task.id, event)}>
                        <SortableContext items={subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
                          {subtasks.map((subtask) => (
                            <SortableRow
                              key={subtask.id}
                              task={subtask}
                              selected={selectedTaskId === subtask.id}
                              onSelect={() => onSelectTask(selectedTaskId === subtask.id ? null : subtask.id)}
                              onComplete={() => completeTask(subtask.id)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  ) : null}
                </SortableRow>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

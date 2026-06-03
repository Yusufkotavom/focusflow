import { useMemo, useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TaskCollectionView } from '@/components/task-collection-view'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/hooks/use-supabase'
import { useTasksData } from '@/hooks/use-tasks-data'
import { isTaskAvailable, isTaskDueToday, isTaskOverdue, isTaskPlannedForToday } from '@/features/tasks/utils/availability'

function QuickCapture({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2 border-b bg-muted/30 px-4 py-3'>
      <Plus className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Capture something... (press Enter)'
        className='border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
        autoFocus
      />
    </form>
  )
}

type InboxTask = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged?: boolean
  user_id?: string
  created_at?: string
  completed_at?: string | null
  project_id?: string | null
  note?: string | null
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
  repeat_rule?: string | null
  order?: number | null
}

type InboxProject = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
}

export function Inbox() {
  const { tasks, projects, isLoading } = useTasksData()
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const tasksQueryKey = ['tasks', userId, getSupabase] as const

  const inboxTasks = useMemo(
    () => (tasks as InboxTask[]).filter((task) => task.status === 'inbox' || task.status === 'completed'),
    [tasks]
  )
  const projectsMap = useMemo(
    () =>
      (projects as InboxProject[]).reduce<Record<string, InboxProject>>((acc, project) => {
        acc[project.id] = project
        return acc
      }, {}),
    [projects]
  )
  const activeTasks = useMemo(
    () => (tasks as InboxTask[]).filter((task) => task.status === 'active'),
    [tasks]
  )
  const todaySummary = {
    overdue: activeTasks.filter((task) => isTaskOverdue(task)).length,
    dueToday: activeTasks.filter((task) => isTaskDueToday(task)).length,
    plannedToday: activeTasks.filter((task) => isTaskPlannedForToday(task)).length,
    available: activeTasks.filter((task) => isTaskAvailable(task, projectsMap, tasks as InboxTask[])).length,
  }

  async function handleAdd(title: string) {
    if (!userId) return
    const tempId = crypto.randomUUID()

    queryClient.setQueryData(tasksQueryKey, (old: InboxTask[] | undefined) => [
      {
        id: tempId,
        title,
        status: 'inbox',
      },
      ...(old ?? []),
    ])

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').insert([
        {
          id: tempId,
          title,
          status: 'inbox',
          user_id: userId,
        },
      ])
      if (error) throw error
    } catch (_err) {
      toast.error('Failed to create task')
      queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    }
  }

  async function handleToggleComplete(id: string, currentStatus: InboxTask['status']) {
    const newStatus = currentStatus === 'completed' ? 'inbox' : 'completed'

    queryClient.setQueryData(tasksQueryKey, (old: InboxTask[] | undefined) =>
      old?.map((task) =>
        task.id === id
          ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : task
      )
    )

    try {
      const supabase = await getSupabase()
      const payload =
        newStatus === 'completed'
          ? { status: newStatus, completed_at: new Date().toISOString() }
          : { status: newStatus, completed_at: null }

      const { error } = await supabase.from('tasks').update(payload).eq('id', id)
      if (error) throw error
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task reopened')
    } catch (_err) {
      toast.error('Failed to update task')
      queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    }
  }

  return (
    <TaskCollectionView
      perspective={{
        id: 'inbox',
        name: 'Inbox',
        description: `${inboxTasks.filter((task) => task.status === 'inbox').length} items · Overdue ${todaySummary.overdue} · Due Today ${todaySummary.dueToday} · Planned ${todaySummary.plannedToday} · Available ${todaySummary.available}`,
        rules: {},
        groupBy: 'none',
        sortBy: 'manual',
        showCompleted: true,
        showDropped: false,
      }}
      tasks={inboxTasks}
      projects={projects as InboxProject[]}
      topContent={<QuickCapture onAdd={handleAdd} />}
      onTaskComplete={handleToggleComplete}
      empty={
        isLoading ? (
          <p className='mt-10 text-center text-sm text-muted-foreground'>Loading tasks...</p>
        ) : (
          <div className='flex h-64 flex-col items-center justify-center text-center'>
            <CheckCircle2 className='mb-3 h-12 w-12 text-muted-foreground/30' />
            <p className='text-sm font-medium text-muted-foreground'>Inbox is empty</p>
            <p className='mt-1 text-xs text-muted-foreground'>All items have been processed.</p>
          </div>
        )
      }
    />
  )
}

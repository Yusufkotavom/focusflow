import { useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useAppStore } from '@/stores/app-store'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { isTaskAvailable, isTaskDueToday, isTaskOverdue, isTaskPlannedForToday } from '@/features/tasks/utils/availability'
import { TaskListRow } from '@/components/task-list-row'
import { useTaskMetadata } from '@/hooks/use-task-metadata'
import { taskRepeatLabel, taskScheduleLabel } from '@/lib/task-display'

function QuickCapture({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2 px-4 py-3 border-b bg-muted/30'>
      <Plus className='h-4 w-4 text-muted-foreground flex-shrink-0' />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Capture something... (press Enter)'
        className='border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm'
        autoFocus
      />
    </form>
  )
}

export function Inbox() {
  const { tasks, projects, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { taskTagsMap } = useTaskMetadata()
  const [showCompleted, setShowCompleted] = useState(true)
  const [showDropped, setShowDropped] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'status' | 'tag' | 'due' | 'planned' | 'defer'>('none')
  const [rules, setRules] = useState({})

  const inboxTasks = tasks.filter((t: any) => t.status === 'inbox')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed')
  const projectsMap = projects.reduce((acc: Record<string, any>, project: any) => {
    acc[project.id] = project
    return acc
  }, {})
  const activeTasks = tasks.filter((t: any) => t.status === 'active')
  const todaySummary = {
    overdue: activeTasks.filter((t: any) => isTaskOverdue(t)).length,
    dueToday: activeTasks.filter((t: any) => isTaskDueToday(t)).length,
    plannedToday: activeTasks.filter((t: any) => isTaskPlannedForToday(t)).length,
    available: activeTasks.filter((t: any) => isTaskAvailable(t, projectsMap, tasks as any[])).length,
  }

  const handleAdd = async (title: string) => {
    if (!userId) return
    const tempId = crypto.randomUUID()
    
    // Optimistic Cache Update
    queryClient.setQueryData(['tasks', userId], (old: any) => [
      { id: tempId, title, status: 'inbox', flagged: false, user_id: userId, created_at: new Date().toISOString() },
      ...(old || [])
    ])

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').insert([{
        id: tempId,
        title,
        status: 'inbox',
        user_id: userId
      }])
      if (error) {
        console.error('Supabase insert error:', error)
        toast.error(`DB Error: ${error.message}`)
        throw error
      }
    } catch (err: any) {
      if (err.message === 'Missing Clerk Token') {
        toast.error('Auth Error: Setup JWT Template in Clerk Dashboard')
      }
      console.error('Insert failed:', err)
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  const handleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'inbox' : 'completed'
    
    // Optimistic update
    queryClient.setQueryData(['tasks', userId], (old: any) => 
      old?.map((t: any) => t.id === id ? { ...t, status: newStatus } : t)
    )

    try {
      const supabase = await getSupabase()
      const payload = newStatus === 'completed' 
        ? { status: newStatus, completed_at: new Date().toISOString() } 
        : { status: newStatus, completed_at: null }
        
      const { error } = await supabase.from('tasks').update(payload).eq('id', id)
      if (error) {
        console.error('Supabase update error:', error)
        toast.error(`DB Error: ${error.message}`)
        throw error
      }
    } catch (err) {
      console.error('Update failed:', err)
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Inbox</h1>
          <p className='text-xs text-muted-foreground'>
            {inboxTasks.length} items · Overdue {todaySummary.overdue} · Due Today {todaySummary.dueToday} · Planned {todaySummary.plannedToday} · Available {todaySummary.available}
          </p>
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
        <QuickCapture onAdd={handleAdd} />

        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
             <p className='text-sm text-muted-foreground text-center mt-10'>Loading tasks...</p>
          ) : inboxTasks.length === 0 && completedTasks.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <CheckCircle2 className='h-12 w-12 text-muted-foreground/30 mb-3' />
              <p className='text-sm font-medium text-muted-foreground'>Inbox is empty</p>
              <p className='text-xs text-muted-foreground mt-1'>All items have been processed.</p>
            </div>
          ) : (
            <>
              {inboxTasks.map((task: any) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                  onComplete={() => handleComplete(task.id, task.status)}
                  showCompletedState
                  subtitle={taskScheduleLabel(task)}
                  repeatLabel={taskRepeatLabel(task)}
                  tags={taskTagsMap[task.id] ?? []}
                />
              ))}

              {completedTasks.length > 0 && (
                <>
                  <div className='px-4 py-2 text-xs text-muted-foreground font-medium bg-muted/30 border-b'>
                    Completed ({completedTasks.length})
                  </div>
                  {completedTasks.map((task: any) => (
                    <TaskListRow
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onSelect={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                      onComplete={() => handleComplete(task.id, task.status)}
                      showCompletedState
                      subtitle={taskScheduleLabel(task)}
                      repeatLabel={taskRepeatLabel(task)}
                      tags={taskTagsMap[task.id] ?? []}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </Main>
    </>
  )
}

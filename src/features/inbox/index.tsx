import { useState } from 'react'
import { Plus, Flag, Circle, CheckCircle2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

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

function TaskRow({
  task,
  isSelected,
  onClick,
  onComplete,
}: {
  task: any
  isSelected: boolean
  onClick: () => void
  onComplete: (id: string, status: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/50',
        'hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent'
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onComplete(task.id, task.status)
        }}
        className='flex-shrink-0 text-muted-foreground hover:text-primary transition-colors'
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className='h-4 w-4 text-primary' />
        ) : (
          <Circle className='h-4 w-4' />
        )}
      </button>

      <span className={cn(
        'flex-1 text-sm',
        task.status === 'completed' && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </span>

      {task.flagged && (
        <Flag className='h-3.5 w-3.5 text-orange-500 flex-shrink-0' />
      )}
    </div>
  )
}

export function Inbox() {
  const { tasks, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  const inboxTasks = tasks.filter((t: any) => t.status === 'inbox')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed')

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
      if (error) throw error
    } catch (err) {
      toast.error('Failed to add task')
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
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
      if (error) throw error
    } catch (err) {
      toast.error('Failed to update task')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Inbox</h1>
          <p className='text-xs text-muted-foreground'>{inboxTasks.length} items</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
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
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onClick={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                  onComplete={handleComplete}
                />
              ))}

              {completedTasks.length > 0 && (
                <>
                  <div className='px-4 py-2 text-xs text-muted-foreground font-medium bg-muted/30 border-b'>
                    Completed ({completedTasks.length})
                  </div>
                  {completedTasks.map((task: any) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onClick={() => setSelectedTask(selectedTaskId === task.id ? null : task.id)}
                      onComplete={handleComplete}
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

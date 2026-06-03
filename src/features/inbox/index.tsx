import { useState } from 'react'
import { Plus, Flag, Circle, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

type Task = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  note?: string
}

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Follow up client restoran',
    status: 'inbox',
    flagged: true,
  },
  { id: '2', title: 'Cek stok bahan baku', status: 'inbox', flagged: false },
  { id: '3', title: 'Buat proposal ERPNext', status: 'inbox', flagged: false },
  { id: '4', title: 'Bayar server bulan ini', status: 'inbox', flagged: true },
  {
    id: '5',
    title: 'Setup accounting system',
    status: 'inbox',
    flagged: false,
  },
  {
    id: '6',
    title: 'Buat landing page jasa website',
    status: 'inbox',
    flagged: false,
  },
  {
    id: '7',
    title: 'Review kontrak supplier',
    status: 'inbox',
    flagged: false,
  },
]

function QuickCapture({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-center gap-2 border-b bg-muted/30 px-4 py-3'
    >
      <Plus className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Capture something... (press Enter)'
        className='border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
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
  task: Task
  isSelected: boolean
  onClick: () => void
  onComplete: (id: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3',
        'transition-colors hover:bg-accent/50',
        isSelected && 'bg-accent'
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onComplete(task.id)
        }}
        className='flex-shrink-0 text-muted-foreground transition-colors hover:text-primary'
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className='h-4 w-4 text-primary' />
        ) : (
          <Circle className='h-4 w-4' />
        )}
      </button>

      <span
        className={cn(
          'flex-1 text-sm',
          task.status === 'completed' && 'text-muted-foreground line-through'
        )}
      >
        {task.title}
      </span>

      {task.flagged && (
        <Flag className='h-3.5 w-3.5 flex-shrink-0 text-orange-500' />
      )}
    </div>
  )
}

export function Inbox() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const { selectedTaskId, setSelectedTask } = useAppStore()

  const inboxTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'dropped'
  )
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const handleAdd = (title: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      status: 'inbox',
      flagged: false,
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const handleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'completed' ? 'inbox' : 'completed' }
          : t
      )
    )
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Inbox</h1>
          <p className='text-xs text-muted-foreground'>
            {inboxTasks.length} items
          </p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='p-0'>
        <QuickCapture onAdd={handleAdd} />

        <div className='overflow-y-auto'>
          {inboxTasks.length === 0 && completedTasks.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <CheckCircle2 className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>
                Inbox is empty
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                All items have been processed.
              </p>
            </div>
          ) : (
            <>
              {inboxTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onClick={() =>
                    setSelectedTask(selectedTaskId === task.id ? null : task.id)
                  }
                  onComplete={handleComplete}
                />
              ))}

              {completedTasks.length > 0 && (
                <>
                  <div className='border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground'>
                    Completed ({completedTasks.length})
                  </div>
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onClick={() =>
                        setSelectedTask(
                          selectedTaskId === task.id ? null : task.id
                        )
                      }
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
